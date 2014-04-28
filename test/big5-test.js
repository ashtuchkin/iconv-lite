var assert  = require('assert'),
    iconv   = require(__dirname + '/../');

var testString = "中文abc", //unicode contains Big5-code and ascii
    testStringBig5Buffer = new Buffer([0xa4,0xa4,0xa4,0xe5,0x61,0x62,0x63]),
    testString2 = '測試',
    testStringBig5Buffer2 = new Buffer([0xb4, 0xfa, 0xb8, 0xd5]);

describe("Big5 tests", function() {
    it("Big5 correctly encoded/decoded", function() {    
        assert.strictEqual(iconv.encode(testString, "big5").toString('hex'), testStringBig5Buffer.toString('hex'));
        assert.strictEqual(iconv.decode(testStringBig5Buffer, "big5"), testString);
        assert.strictEqual(iconv.encode(testString2, 'big5').toString('hex'), testStringBig5Buffer2.toString('hex'));
        assert.strictEqual(iconv.decode(testStringBig5Buffer2, 'big5'), testString2);
    });

    it("cp950 correctly encoded/decoded", function() {    
        assert.strictEqual(iconv.encode(testString, "cp950").toString('hex'), testStringBig5Buffer.toString('hex'));
        assert.strictEqual(iconv.decode(testStringBig5Buffer, "cp950"), testString);
    });

    it("Big5 file read decoded,compare with iconv result", function() {
        var contentBuffer = new Buffer('PEhUTUw+DQo8SEVBRD4gICAgDQoJPFRJVExFPiBtZXRhILzQxdKquqjPpc6hR6SkpOW69K22IDwvVElUTEU+DQoJPG1ldGEgSFRUUC1FUVVJVj0iQ29udGVudC1UeXBlIiBDT05URU5UPSJ0ZXh0L2h0bWw7IGNoYXJzZXQ9YmlnNSI+DQo8L0hFQUQ+DQo8Qk9EWT4NCg0Ks2+sT6RArdPBY8XppKSk5br0rbahSTxicj4NCihUaGlzIHBhZ2UgdXNlcyBiaWc1IGNoYXJhY3RlciBzZXQuKTxicj4NCmNoYXJzZXQ9YmlnNQ0KDQo8L0JPRFk+DQo8L0hUTUw+', 'base64');
        var str = iconv.decode(contentBuffer, "big5");
        var iconvc = new (require('iconv').Iconv)('big5','utf8');
        assert.strictEqual(iconvc.convert(contentBuffer).toString(), str);
    });

    it("Big5 correctly decodes and encodes characters · and ×", function() {
        // https://github.com/ashtuchkin/iconv-lite/issues/13
        // Reference: http://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP950.TXT
        var chars = "·×";
        var big5Chars = new Buffer([0xA1, 0x50, 0xA1, 0xD1]);
        assert.strictEqual(iconv.encode(chars, "big5").toString('hex'), big5Chars.toString('hex'));
        assert.strictEqual(iconv.decode(big5Chars, "big5"), chars)
    });

    it("Big5 correctly encodes & decodes sequences", function() {
        assert.strictEqual(iconv.encode("\u00CA\u0304", "big5").toString('hex'), "8862");
        assert.strictEqual(iconv.encode("\u00EA\u030C", "big5").toString('hex'), "88a5");
        assert.strictEqual(iconv.encode("\u00CA", "big5").toString('hex'), "8866");
        assert.strictEqual(iconv.encode("\u00CA\u00CA", "big5").toString('hex'), "88668866");

        assert.strictEqual(iconv.encode("\u00CA\uD800", "big5").toString('hex'), "88663f");         // Unfinished surrogate.
        assert.strictEqual(iconv.encode("\u00CA\uD841\uDD47", "big5").toString('hex'), "8866fa40"); // Finished surrogate ('𠕇').
        assert.strictEqual(iconv.encode("\u00CA𠕇", "big5").toString('hex'), "8866fa40");            // Finished surrogate ('𠕇').

        assert.strictEqual(iconv.decode(new Buffer('8862', 'hex'), "big5"), "\u00CA\u0304");
        assert.strictEqual(iconv.decode(new Buffer('8866', 'hex'), "big5"), "\u00CA");
        assert.strictEqual(iconv.decode(new Buffer('8866fa40', 'hex'), "big5"), "\u00CA𠕇");
    });
});
