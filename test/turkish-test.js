var assert = require('assert'),
    iconv = require(__dirname+'/../');

var ascii = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\x0c\r\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f'+
           ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7f';

var encodings = [{
    name: "windows1254",
    variations: ['windows-1254', 'win-1254', 'win1254', 'cp1254', 'cp-1254', 1254],
    strings: {
        empty: "",
        ascii: ascii,
        turkish: "€‚ƒ„…†‡ˆ‰Š‹Œ‘’“”•–—˜™š›œŸ¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏĞÑÒÓÔÕÖ×ØÙÚÛÜİŞßàáâãäåæçèéêëìíîïğñòóôõö÷øùúûüışÿ",
        untranslatable: "\x81\x8d\x8e\x8f\x90\x9d\x9e"
    },
    encodedStrings: {
        empty: new Buffer(''),
        ascii: new Buffer(ascii, 'binary'),
        turkish: new Buffer(
            '\x80\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x8b\x8c' +
            '\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9a\x9b\x9c\x9f' +
            '\xa1\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xab\xac\xae\xaf' +
            '\xb0\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf' +
            '\xc0\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf' +
            '\xd0\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde\xdf' +
            '\xe0\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef' +
            '\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe\xff',
            'binary'),
    }
}, {
    name: "iso88599",
    variations: ['iso-8859-9', 'turkish', 'turkish8', 'cp28599', 'cp-28599', 28599],
    strings: {
        empty: "",
        ascii: ascii,
        turkish: "\xa0¡¢£¤¥¦§¨©ª«¬\xad®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏĞÑÒÓÔÕÖ×ØÙÚÛÜİŞßàáâãäåæçèéêëìíîïğñòóôõö÷øùúûüışÿ",
        untranslatable: ''
    },
    encodedStrings: {
        empty: new Buffer(''),
        ascii: new Buffer(ascii, 'binary'),
        turkish: new Buffer(
            '\xa0\xa1\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xab\xac\xad\xae\xaf' +
            '\xb0\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf' +
            '\xc0\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf' +
            '\xd0\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde\xdf' +
            '\xe0\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef' +
            '\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe\xff',
             'binary')
    }
}];

describe("Test Turkish encodings", function() {
    encodings.forEach(function(encoding) {
        var enc = encoding.variations[0];
        var key = "turkish";
        describe(encoding.name+":", function() {
            it("Convert from buffer", function() {
                for (var key in encoding.encodedStrings)
                    assert.strictEqual(iconv.decode(encoding.encodedStrings[key], enc),
                        encoding.strings[key]);
            });

            it("Convert to buffer", function() {
                for (var key in encoding.encodedStrings)
                    assert.strictEqual(iconv.encode(encoding.strings[key], enc).toString('binary'),
                        encoding.encodedStrings[key].toString('binary'));
            });

            it("Try different variations of encoding", function() {
                encoding.variations.forEach(function(enc) {
                    assert.strictEqual(iconv.decode(encoding.encodedStrings[key], enc), encoding.strings[key]);
                    assert.strictEqual(iconv.encode(encoding.strings[key], enc).toString('binary'), encoding.encodedStrings[key].toString('binary'));
                });
            });

            it("Untranslatable chars are converted to defaultCharSingleByte", function() {
                var expected = encoding.strings.untranslatable.split('').map(function(c) {return iconv.defaultCharSingleByte; }).join('');
                assert.strictEqual(iconv.encode(encoding.strings.untranslatable, enc).toString('binary'), expected); // Only '?' characters.
            });
        });
    });
});
