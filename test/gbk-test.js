var vows    = require('vows'),
    fs      = require('fs'),
    assert  = require('assert'),
    iconv   = require(__dirname+'/../');

var testString = "中国abc",//unicode contains GBK-code and ascii
    testStringGBKBuffer = new Buffer([0xd6,0xd0,0xb9,0xfa,0x61,0x62,0x63]);

vows.describe("GBK tests").addBatch({
    "Vows is working": function() {},
    "Return values are of correct types": function() {
        assert.ok(iconv.toEncoding(testString, "utf8") instanceof Buffer);        
        var s = iconv.fromEncoding(new Buffer(testString), "utf8");
        assert.strictEqual(Object.prototype.toString.call(s), "[object String]");
    },
    "GBK correctly encoded/decoded": function() {    
        assert.strictEqual(iconv.toEncoding(testString, "GBK").toString('binary'), testStringGBKBuffer.toString('binary'));
        assert.strictEqual(iconv.fromEncoding(testStringGBKBuffer, "GBK"), testString);
    },
    "GB2312 correctly encoded/decoded": function() {    
        assert.strictEqual(iconv.toEncoding(testString, "GB2312").toString('binary'), testStringGBKBuffer.toString('binary'));
        assert.strictEqual(iconv.fromEncoding(testStringGBKBuffer, "GB2312"), testString);
    },
    "GBK file read decoded,compare with iconv result": function() {
        var contentBuffer = fs.readFileSync(__dirname+"/gbkFile.txt");
        var str = iconv.fromEncoding(contentBuffer, "GBK");
        var iconvc = new (require('iconv').Iconv)('GBK','utf8');
        assert.strictEqual(iconvc.convert(contentBuffer).toString(), str);
    },
}).export(module)
