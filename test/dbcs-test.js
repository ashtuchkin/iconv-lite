var fs      = require('fs'),
    assert  = require('assert'),
    iconv   = require(__dirname+'/../'),
    Iconv   = require('iconv').Iconv;


// Make all valid input combinations for a given encoding and call fn with it.
// fn(valid, input, output)
function forAllChars(converter, fn, origbuf, len) {
    if (!origbuf) {
        origbuf = new Buffer(10);
        len = 1;
    }
    var buf = origbuf.slice(0, len);
    for (var i = 0; i < 0x100; i++) {
        buf[len-1] = i;
        try {
            var res = converter(buf);
            
            // buf contains correct input combination. Run fn with input and converter output.
            fn(true, buf, res);

        } catch (e) {
            if (e.code == "EILSEQ") { // Invalid character sequence.
                // Notify that this sequence is invalid.
                fn(false, buf);
            }
            else if (e.code == "EINVAL") { // Partial character sequence.
                // Recurse deeper.
                forAllChars(converter, fn, origbuf, len+1);
            }
            else
                throw e;
        }
    }
}

function convertWithDefault(converter, buf, def) {
    try {
        return converter.convert(buf);
    } catch (e) {
        if (e.code != "EILSEQ")
            throw e;
    }
    return def;
}

var aliases = {
    shiftjis: 'shift-jis',
    big5: 'big5-2003',
};
var iconvChanges = {
    // cp932 is changed in iconv (see comments in cp932.h)
    cp932: {"〜":"～","‖":"∥","−":"－","¢":"￠","£":"￡","¬":"￢"},
    cp950: {"¥":"￥"},
    shiftjis: {"＼":"\\","\\":"?"}, // iconv has changed mapping of 5c (reverse solidus) to ff3c (full width reverse solidus)

    // Big5 has more differences. See http://moztw.org/docs/big5/ for explanation.
    big5: {
        "―":"–","‾":"¯","━":"═","┝":"╞","┿":"╪","┥":"╡","〸":"十","〹":"卄","〺":"卅","彞":"彝","⼂":"丶","⼃":"丿","⼅":"亅",
        "⼇":"亠","⼌":"冂","⼍":"冖","⼎":"冫","⼓":"勹","⼖":"匸","⼙":"卩","⼛":"厶","⼢":"夊","⼧":"宀","⼮":"巛","⼳":"幺",
        "⼴":"广","⼵":"廴","⼹":"彐","⼺":"彡","⽁":"攴","⽆":"无","⽧":"疒","⽨":"癶","⾡":"辵","⾪":"隶","＾":"ˆ","╔":"╭",
        "╗":"╮","╚":"╰","╝":"╯"
    },
}

function swapBytes(buf) { for (var i = 0; i < buf.length; i+=2) buf.writeUInt16LE(buf.readUInt16BE(i), i); return buf; }
function spacify2(str) { return str.replace(/(..)/g, "$1 ").trim(); }
function spacify4(str) { return str.replace(/(....)/g, "$1 ").trim(); }
function strToHex(str) { return spacify4(swapBytes(new Buffer(str, 'ucs2')).toString('hex')); }

// Generate tests for all DBCS encodings.
iconv.encode('', 'utf8'); // Load all encodings.

describe("Full DBCS encoding tests", function() {
    this.timeout(5000); // Tese tests are pretty slow.

    for (var enc in iconv.encodings) {
        if (iconv.encodings[enc].type === '_dbcs') (function(enc) {
            // Create tests for this encoding.
            it("Decode DBCS encoding '" + enc + "'", function() {
                var iconvChgs = iconvChanges[enc] || {};
                var converter = new Iconv(aliases[enc] || enc, "utf-8");
                var errors = [];
                forAllChars(converter.convert.bind(converter), function(valid, inp, outp) {
                    if (!valid) // Skip invalid sequences.
                        return;

                    var strExpected = outp.toString('utf-8');
                    var strActual = iconv.decode(inp, enc);

                    var expectedChar = strExpected.charCodeAt(0);
                    if (0xE000 <= expectedChar && expectedChar < 0xF900)  // Skip Private use area.
                        return;

                    if (iconvChgs[strExpected] == strActual)  // Skip iconv changes.
                        return;

                    if (strActual !== strExpected)
                        errors.push({ input: inp.toString('hex'), strExpected: strExpected, strActual: strActual });
                });

                if (errors.length > 0)
                    assert.fail(null, null, "Decoding mismatch: <input> | <expected> | <actual> | <expected char> | <actual char>\n"
                        + errors.map(function(err) {
                        return "          " + spacify2(err.input) + " | " + strToHex(err.strExpected) + " | " + strToHex(err.strActual) + " | " + 
                            err.strExpected + " | " + err.strActual;
                    }).join("\n") + "\n       ");
            });

            it("Encode DBCS encoding '" + enc + "'", function() {
                var iconvChgs = iconvChanges[enc] || {};
                var converter = new Iconv("utf-8", aliases[enc] || enc);
                var errors = [];
                for (var i = 0; i < 0x10000; i++) {
                    if (i == 0xD800) i = 0xF900; // Skip surrogates & private use.

                    var str = String.fromCharCode(i);
                    var strExpected = convertWithDefault(converter, str, new Buffer(iconv.defaultCharSingleByte)).toString('hex');
                    var strActual = iconv.encode(str, enc).toString('hex');

                    if (strExpected == strActual)
                        continue;
                    
                    var str1 = iconv.decode(new Buffer(strExpected, 'hex'), enc);
                    var str2 = iconv.decode(new Buffer(strActual, 'hex'), enc);
                    if (str1 == str && str2 == str)
                       continue; // There are multiple ways to encode str, so it doesn't matter which we choose.

                    if ((enc == 'big5' || enc == 'gbk') && str1 == '?')
                        continue; // Big5 and GBK variations that we use are much larger.

                    if (iconvChgs[str] == iconv.decode(new Buffer(strExpected, 'hex'), enc))
                        continue; // Skip iconv changes.

                    errors.push({input: strToHex(str), inputChar: str, strExpected: strExpected, strActual: strActual});
                }

                if (errors.length > 0)
                    assert.fail(null, null, "Encoding mismatch: <input> | <input char> | <expected> | <actual>\n"
                        + errors.map(function(err) {
                        return "          " + err.input + " | " + err.inputChar + " | " + spacify2(err.strExpected) + " | " + spacify2(err.strActual);
                    }).join("\n") + "\n       ");
            });
        })(enc);
    }
});

