var vows    = require('vows'),
    assert  = require('assert'),
    iconv   = require(__dirname+'/../');

var testStringUtf = "\u00ba\u00b0\uc96fabc",
    testStringCP949Buffer = new Buffer([0xa8,0xac, 0xa1,0xc6, 0xa2,0xa0, 0x61, 0x62, 0x63]);

vows.describe("CP949 tests").addBatch({
    "Vows is working": function() {},
    "CP949 correctly encoded/decoded": function() {    
        assert.strictEqual(iconv.toEncoding(testStringUtf, "cp949").toString('binary'), testStringCP949Buffer.toString('binary'));
        assert.strictEqual(iconv.fromEncoding(testStringCP949Buffer, "cp949"), testStringUtf);
    },
    "ks_c_5601-1987 correctly encoded/decoded": function() {    
        assert.strictEqual(iconv.toEncoding(testStringUtf, "ks_c_5601-1987").toString('binary'), testStringCP949Buffer.toString('binary'));
        assert.strictEqual(iconv.fromEncoding(testStringCP949Buffer, "ks_c_5601-1987"), testStringUtf);
    },
}).export(module)
