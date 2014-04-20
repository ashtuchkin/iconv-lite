var vows    = require('vows'),
    fs      = require('fs'),
    assert  = require('assert'),
    iconv   = require(__dirname+'/../');


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
    'cp932': {"301c": "ff5e", "2016": "2225", "2212": "ff0d", "a2": "ffe0", "a3": "ffe1", "ac": "ffe2"},
    'cp950': {"a5": "ffe5"}, // iconv changed mapping of a5 (Yen) to ffe5 (fullwidth yen)
    'shiftjis': {'ff3c': '5c', '5c': '3f'}, // iconv has changed mapping of 5c (reverse solidus) to ff3c (full width reverse solidus)

    // Big5 is more different. See http://moztw.org/docs/big5/ for explanation.
    'big5': {'2015': '2013', '203e': 'af', '2501': '2550', '251d': '255e', '253f': '256a', '2525': '2561', '3038': '5341', '3039': '5344',
        '303a': '5345', '5f5e': '5f5d', '2f02': '4e36', '2f03': '4e3f', '2f05': '4e85', '2f07': '4ea0', '2f0c': '5182',
        '2f0d': '5196', '2f0e': '51ab', '2f13': '52f9', '2f16': '5338', '2f19': '5369', '2f1b': '53b6', '2f22': '590a',
        '2f27': '5b80', '2f2e': '5ddb', '2f33': '5e7a', '2f34': '5e7f', '2f35': '5ef4', '2f39': '5f50', '2f3a': '5f61',
        '2f41': '6534', '2f46': '65e0', '2f67': '7592', '2f68': '7676', '2fa1': '8fb5', '2faa': '96b6', 'ff3e': '2c6',
        '2554': '256d', '2557': '256e', '255a': '2570', '255d': '256f',
    },
}

var iconvChangesBack = {
    'cp932': {"a2": "8191", "a3": "8192", "ac": "81ca", "2016": "8161", "2212": "817c", "301c": "8160"},
}

// Generate tests for all DBCS encodings.
iconv.getCodec('utf8'); // Load all encodings.
var dbcsEncodingTests = {};
for (var enc in iconv.encodings) {
    if (iconv.encodings[enc].type === '_dbcs') (function(enc) {
        // Create tests for this encoding.
        dbcsEncodingTests[enc+" correctly encoded"] = function() {
            var iconvChgs = iconvChanges[enc] || {};
            var converter = new require('iconv').Iconv(aliases[enc] || enc, "utf-8"), buf = new Buffer(10), cnt = 0;
            forAllChars(converter.convert.bind(converter), function(valid, inp, outp) {
                if (valid) {
                    var res = iconv.decode(inp, enc);
                    var outps = outp.toString('utf-8');
                    var outpn = outps.charCodeAt(0);
                    
                    if (res != outps 
                            && (outpn < 0xE000 || outpn > 0xF8FF)  // Skip Private use area.
                            && iconvChgs[outpn.toString(16)] != res.charCodeAt(0).toString(16)  // Skip iconv changes.
                            && cnt++ < 500000) {
                        console.log(inp, 
                            outp, outps, outpn.toString(16),
                            new Buffer(res), res, res.charCodeAt(0).toString(16));
                        assert.fail();
                    }
                }
            }, buf, 1);
        };
        dbcsEncodingTests[enc+" correctly decoded"] = function() {
            var iconvChgs = iconvChanges[enc] || {};
            var converter = new require('iconv').Iconv("utf-8", aliases[enc] || enc), buf = new Buffer(10), cnt = 0;
            for (var i = 0; i < 0x10000; i++) {
                if (i == 0xD800) i = 0xF900; // Skip surrogates & private use, Specials
                var str = String.fromCharCode(i);
                var buf1 = convertWithDefault(converter, str, new Buffer(iconv.defaultCharSingleByte)).toString('hex');
                var buf2 = iconv.encode(str, enc).toString('hex');
                if (buf1 != buf2) {
                    var str1 = iconv.decode(new Buffer(buf1, 'hex'), enc);
                    var str2 = iconv.decode(new Buffer(buf2, 'hex'), enc);
                    if (str1 == str && str2 == str)
                        continue; // There are multiple ways to encode str, so it doesn't matter which we choose.

                    if ((enc == 'big5' || enc == 'gbk') && str1 == '?')
                        continue; // Big5 and GBK variations that we use are much larger.

                    if (iconvChgs[i.toString(16)] == iconv.decode(new Buffer(buf1, 'hex'), enc).charCodeAt(0).toString(16))
                        continue; // Skip iconv changes.

                    console.log(enc, i.toString(16), buf1, buf2);
                    assert.strictEqual(buf1, buf2);
                }
            }
        };
    })(enc);
}



vows.describe("DBCS encoding tests")
    .addBatch(dbcsEncodingTests)
    .export(module);

