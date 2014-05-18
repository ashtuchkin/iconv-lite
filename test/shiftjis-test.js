var assert  = require('assert'),
    iconv   = require(__dirname + '/../');

describe("ShiftJIS tests", function() {
    it("ShiftJIS correctly encoded/decoded", function() {    
        var testString = "中文abc", //unicode contains ShiftJIS-code and ascii
            testStringBig5Buffer = new Buffer([0x92, 0x86, 0x95, 0xb6, 0x61, 0x62, 0x63]),
            testString2 = '測試',
            testStringBig5Buffer2 = new Buffer([0x91, 0xaa, 0x8e, 0x8e]);

        assert.strictEqual(iconv.encode(testString, "shiftjis").toString('hex'), testStringBig5Buffer.toString('hex'));
        assert.strictEqual(iconv.decode(testStringBig5Buffer, "shiftjis"), testString);
        assert.strictEqual(iconv.encode(testString2, 'shiftjis').toString('hex'), testStringBig5Buffer2.toString('hex'));
        assert.strictEqual(iconv.decode(testStringBig5Buffer2, 'shiftjis'), testString2);
    });

    it("ShiftJIS extended chars are decoded, but not encoded", function() {
        var buf = new Buffer('ed40eefceeef', 'hex'), str = "纊＂ⅰ", res = "fa5cfa57fa40", // repeated block (these same chars are repeated in the different place)
            buf2 = new Buffer('f040f2fcf940', 'hex'), str2 = "", res2 = "3f3f3f";   // non-repeated, UA block.

        assert.strictEqual(iconv.decode(buf, "shiftjis"), str);
        assert.strictEqual(iconv.decode(buf2, "shiftjis"), str2);

        assert.strictEqual(iconv.encode(str, "shiftjis").toString('hex'), res);
        assert.strictEqual(iconv.encode(str2, "shiftjis").toString('hex'), res2);
    });

    it("ShiftJIS includes extensions", function() {
        assert.strictEqual(iconv.decode(new Buffer('8740', 'hex'), 'shiftjis'), '①');
        assert.strictEqual(iconv.encode('①', 'shiftjis').toString('hex'), '8740');
    });
});
