var vows    = require('vows'),
    fs      = require('fs'),
    assert  = require('assert'),
    iconv   = require(__dirname+'/../'),
    Iconv   = require('iconv').Iconv;


// Make all valid input combinations for a given encoding and call fn with it.
// fn(valid, input, output)
function forAllChars(converter, fn, origbuf, len) {
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
    'shiftjis': 'shift-jis',
    'big5': 'big5-2003',
};
var iconvChanges = {
    // cp932 is changed in iconv (see comments in cp932.h)
    'cp932': {'301c': 'ff5e', '2016': '2225', '2212': 'ff0d', '00a2': 'ffe0', '00a3': 'ffe1', '00ac': 'ffe2'},
    'cp950': {'00a5': 'ffe5'}, // iconv changed mapping of a5 (Yen) to ffe5 (fullwidth yen)
    'shiftjis': {'ff3c': '005c', '005c': '003f'}, // iconv has changed mapping of 5c (reverse solidus) to ff3c (full width reverse solidus)

    // Big5 has more differences. See http://moztw.org/docs/big5/ for explanation.
    'big5': {'2015': '2013', '203e': '00af', '2501': '2550', '251d': '255e', '253f': '256a', '2525': '2561', '3038': '5341', '3039': '5344',
        '303a': '5345', '5f5e': '5f5d', '2f02': '4e36', '2f03': '4e3f', '2f05': '4e85', '2f07': '4ea0', '2f0c': '5182',
        '2f0d': '5196', '2f0e': '51ab', '2f13': '52f9', '2f16': '5338', '2f19': '5369', '2f1b': '53b6', '2f22': '590a',
        '2f27': '5b80', '2f2e': '5ddb', '2f33': '5e7a', '2f34': '5e7f', '2f35': '5ef4', '2f39': '5f50', '2f3a': '5f61',
        '2f41': '6534', '2f46': '65e0', '2f67': '7592', '2f68': '7676', '2fa1': '8fb5', '2faa': '96b6', 'ff3e': '02c6',
        '2554': '256d', '2557': '256e', '255a': '2570', '255d': '256f',
    },
}

function swapBytes(buf) { for (var i = 0; i < buf.length; i+=2) buf.writeUInt16LE(buf.readUInt16BE(i), i); return buf; }
function spacify2(str) { return str.replace(/(..)/g, "$1 ").trim(); }
function spacify4(str) { return str.replace(/(....)/g, "$1 ").trim(); }

// Generate tests for all DBCS encodings.
iconv.encode('', 'utf8'); // Load all encodings.
var dbcsEncodingTests = {};
for (var enc in iconv.encodings) {
    if (iconv.encodings[enc].type === '_dbcs') (function(enc) {
        // Create tests for this encoding.
        dbcsEncodingTests[enc+" decoding"] = function() {
            var iconvChgs = iconvChanges[enc] || {};
            var converter = new Iconv(aliases[enc] || enc, "ucs-2be"), buf = new Buffer(10);
            var errors = [];
            forAllChars(converter.convert.bind(converter), function(valid, inp, outp) {
                if (!valid) // Skip invalid sequences.
                    return;

                var strExpected = spacify4(outp.toString('hex'));

                var res = iconv.decode(inp, enc);
                var strActual = spacify4(swapBytes(new Buffer(res, 'ucs2')).toString('hex'));

                var expectedChar = parseInt(strExpected, 16);
                if (0xE000 <= expectedChar && expectedChar < 0xF900)  // Skip Private use area.
                    return;

                if (iconvChgs[strExpected] == strActual)  // Skip iconv changes.
                    return;

                if (strActual !== strExpected)
                    errors.push({strExpected: strExpected, strActual: strActual, input: inp.toString('hex'), 
                        strExpectedChar: swapBytes(outp).toString('ucs2'), strActualChar: res });
            }, buf, 1);

            if (errors.length > 0)
                assert.fail(null, null, "Decoding mismatch: <input> | <expected> | <actual> | <expected char> | <actual char>\n"
                    + errors.map(function(err) {
                    return "          " + spacify2(err.input) + " | " + err.strExpected + " | " + err.strActual + " | " + 
                        err.strExpectedChar + " | " + err.strActualChar;
                }).join("\n") + "\n       ");
        };

        dbcsEncodingTests[enc+" encoding"] = function() {
            var iconvChgs = iconvChanges[enc] || {};
            var converter = new Iconv("utf-8", aliases[enc] || enc), buf = new Buffer(10), cnt = 0;
            var convertBack = new Iconv(aliases[enc] || enc, "ucs-2le");
            var errors = [];
            for (var i = 0; i < 0x10000; i++) {
                if (i == 0xD800) i = 0xF900; // Skip surrogates & private use.

                var str = String.fromCharCode(i);
                var strHex = swapBytes(new Buffer(str, 'ucs2')).toString('hex');
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

                if (iconvChgs[strHex] == swapBytes(new Buffer(iconv.decode(new Buffer(strExpected, 'hex'), enc), 'ucs2')).toString('hex'))
                    continue; // Skip iconv changes.

                errors.push({strExpected: strExpected, strActual: strActual, input: strHex, inputChar: str});
            }
            if (errors.length > 0)
                assert.fail(null, null, "Encoding mismatch: <input> | <input char> | <expected> | <actual>\n"
                    + errors.map(function(err) {
                    return "          " + err.input + " | " + err.inputChar + " | " + spacify2(err.strExpected) + " | " + spacify2(err.strActual);
                }).join("\n") + "\n       ");
        };
    })(enc);
}



vows.describe("DBCS encoding tests")
    .addBatch(dbcsEncodingTests)
    .export(module);

