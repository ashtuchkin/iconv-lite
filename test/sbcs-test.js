var assert = require('assert'),
    unorm = require('unorm'),
    iconv = require(__dirname+'/../'),
    Iconv = require('iconv').Iconv;

function convertWithDefault(converter, buf, def) {
    var res = converter.convert(buf);
    return res.length > 0 ? res : def;
}

var skipEncodings = { // Not supported by iconv.
    maccenteuro: true,
    cp808: true,
}; 
var aliases = {
    armscii8: "ARMSCII-8",
    georgianacademy: "GEORGIAN-ACADEMY",
    georgianps: "GEORGIAN-PS",
    iso646cn: "ISO646-CN",
    iso646jp: "ISO646-JP",
    hproman8: "HP-ROMAN8",
}

function iconvAlias(enc) {
    var r;
    if (r = /windows(\d+)/.exec(enc))
        return "WINDOWS-"+r[1];
    if (r = /iso8859(\d+)/.exec(enc))
        return "ISO8859-"+r[1];
    if (r = /koi8(\w+)/.exec(enc))
        return "KOI8-"+r[1];
    if (aliases[enc])
        return aliases[enc];
    return enc;
}

var normalizedEncodings = { windows1255: true, windows1258: true, tcvn: true };

var combClass = {'\u0327': 202, '\u0323': 220, '\u031B': 216}; // Combining class of unicode characters.
for (var i = 0x300; i < 0x315; i++) combClass[String.fromCharCode(i)] = 230;

var iconvEquivChars = {
    cp1163: {'\u00D0': '\u0110', '\u203E': '\u00AF'},
}


function swapBytes(buf) { for (var i = 0; i < buf.length; i+=2) buf.writeUInt16LE(buf.readUInt16BE(i), i); return buf; }
function spacify2(str) { return str.replace(/(..)/g, "$1 ").trim(); }
function spacify4(str) { return str.replace(/(....)/g, "$1 ").trim(); }
function strToHex(str) { return spacify4(swapBytes(new Buffer(str, 'ucs2')).toString('hex')); }

// Generate tests for all SBCS encodings.
iconv.encode('', 'utf8'); // Load all encodings.


var sbcsEncodingTests = {};
describe("Full SBCS encoding tests", function() {
    for (var enc in iconv.encodings)
        if (iconv.encodings[enc].type === '_sbcs' && !skipEncodings[enc]) (function(enc) {

            it("Decode SBCS encoding '" + enc + "'", function() {
                var conv = new Iconv(iconvAlias(enc), "utf-8//IGNORE");
                var errors = [];
                for (var i = 0; i < 0x100; i++) {
                    var buf = new Buffer([i]);
                    var strActual   = iconv.decode(buf, enc);
                    var strExpected = convertWithDefault(conv, buf, iconv.defaultCharUnicode).toString();

                    if (strActual != strExpected)
                        errors.push({input: buf.toString('hex'), strExpected: strExpected, strActual: strActual});
                }
                if (errors.length > 0)
                    assert.fail(null, null, "Decoding mismatch: <input> | <expected> | <actual> | <expected char> | <actual char>\n"
                        + errors.map(function(err) {
                        return "          " + spacify2(err.input) + " | " + strToHex(err.strExpected) + " | " + strToHex(err.strActual) + " | " + 
                            err.strExpected + " | " + err.strActual;
                    }).join("\n") + "\n       ");
            });

            it("Encode SBCS encoding '" + enc + "'", function() {
                var conv = new Iconv("utf-8", iconvAlias(enc) + "//IGNORE");
                var errors = [];

                for (var i = 0; i < 0xFFF0; i++) {
                    if (i == 0xD800) i = 0xF900; // Skip surrogates & private use

                    var str = String.fromCharCode(i);
                    var strExpected = convertWithDefault(conv, str, new Buffer(iconv.defaultCharSingleByte)).toString('hex');
                    var strActual = iconv.encode(str, enc).toString('hex');

                    if (strExpected == strActual)
                        continue;

                    // We are not supporting unicode normalization/decomposition of input, so skip it.
                    // (when single unicode char results in >1 encoded chars because of diacritics)
                    if (normalizedEncodings[enc] && strActual == iconv.defaultCharSingleByte.charCodeAt(0).toString(16)) {
                        var strDenormStrict = unorm.nfd(str); // Strict decomposition
                        if (strExpected == iconv.encode(strDenormStrict, enc).toString('hex'))
                            continue;

                        var strDenorm = unorm.nfkd(str); // Check also compat decomposition.
                        if (strExpected == iconv.encode(strDenorm, enc).toString('hex'))
                            continue;

                        // Try semicomposition if we have 2 combining characters.
                        if (strDenorm.length == 3 && !combClass[strDenorm[0]] && combClass[strDenorm[1]] && combClass[strDenorm[2]]) {
                            // Semicompose without swapping.
                            var strDenorm2 = unorm.nfc(strDenorm[0] + strDenorm[1]) + strDenorm[2];
                            if (strExpected == iconv.encode(strDenorm2, enc).toString('hex'))
                                continue;                        

                            // Swap combining characters if they have different combining classes, making swap unicode-equivalent.
                            var strDenorm3 = unorm.nfc(strDenorm[0] + strDenorm[2]) + strDenorm[1];
                            if (strExpected == iconv.encode(strDenorm3, enc).toString('hex'))
                                if (combClass[strDenorm[1]] != combClass[strDenorm[2]])
                                    continue;
                                else
                                    // In theory, if combining classes are the same, we can not swap them. But iconv thinks otherwise.
                                    // So we skip this too.
                                    continue;
                        }
                    }

                    // Iconv sometimes treats some characters as equivalent. Check it and skip.
                    if (iconvEquivChars[enc] && iconvEquivChars[enc][str] && 
                        strExpected == iconv.encode(iconvEquivChars[enc][str], enc).toString('hex'))
                        continue;

                    errors.push({input: strToHex(str), inputChar: str, strExpected: strExpected, strActual: strActual});
                }

                if (errors.length > 0)
                    assert.fail(null, null, "Encoding mismatch: <input> | <input char> | <expected> | <actual>\n"
                        + errors.map(function(err) {
                        return "          " + err.input + " | " + err.inputChar + " | " + spacify2(err.strExpected) + " | " + spacify2(err.strActual);
                    }).join("\n") + "\n       ");
            });

            /*
            // TODO: Implement unicode composition. After that, this test will be meaningful.

            // Create a large random text.
            var buf2 = new Buffer(100);
            for (var i = 0; i < buf2.length; i++)
                buf2[i] = buf[(Math.random()*buf.length) | 0];

            // Check both encoding and decoding.
            assert.strictEqual(JSON.stringify(iconv.decode(buf2, enc)), JSON.stringify(str = conv.convert(buf2).toString()));
            assert.strictEqual(iconv.encode(str, enc).toString('hex'), convBack.convert(new Buffer(str)).toString('hex'));
            */
        })(enc);
});

