var fs      = require('fs'),
    assert  = require('assert'),
    iconv   = require(__dirname+'/../');

var testString = "中国abc",//unicode contains GBK-code and ascii
    testStringGBKBuffer = new Buffer([0xd6,0xd0,0xb9,0xfa,0x61,0x62,0x63]);

describe("GBK tests", function() {
    it("GBK correctly encoded/decoded", function() {    
        assert.strictEqual(iconv.encode(testString, "GBK").toString('binary'), testStringGBKBuffer.toString('binary'));
        assert.strictEqual(iconv.decode(testStringGBKBuffer, "GBK"), testString);
    });

    it("GB2312 correctly encoded/decoded", function() {    
        assert.strictEqual(iconv.encode(testString, "GB2312").toString('binary'), testStringGBKBuffer.toString('binary'));
        assert.strictEqual(iconv.decode(testStringGBKBuffer, "GB2312"), testString);
    });

    it("GBK file read decoded,compare with iconv result", function() {
        var contentBuffer = fs.readFileSync(__dirname+"/gbkFile.txt");
        var str = iconv.decode(contentBuffer, "GBK");
        var iconvc = new (require('iconv').Iconv)('GBK','utf8');
        assert.strictEqual(iconvc.convert(contentBuffer).toString(), str);
    });

    it("GBK correctly decodes and encodes characters · and ×", function() {
        // https://github.com/ashtuchkin/iconv-lite/issues/13
        // Reference: http://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP936.TXT
        var chars = "·×";
        var gbkChars = new Buffer([0xA1, 0xA4, 0xA1, 0xC1]);
        assert.strictEqual(iconv.encode(chars, "GBK").toString('binary'), gbkChars.toString('binary'));
        assert.strictEqual(iconv.decode(gbkChars, "GBK"), chars)
    });

    it("GB18030 findIdx works correctly", function() {
        function findIdxAlternative(table, val) {
            for (var i = 0; i < table.length; i++)
                if (table[i] > val)
                    return i-1;
            return table.length - 1;
        }

        var codec = iconv.getCodec('gb18030').encoder();

        for (var i = 0; i < 0x100; i++)
            assert.strictEqual(codec.findIdx(codec.gb18030.uChars, i), findIdxAlternative(codec.gb18030.uChars, i), i);

        var tests = [0xFFFF, 0x10000, 0x10001, 0x30000];
        for (var i = 0; i < tests.length; i++)
            assert.strictEqual(codec.findIdx(codec.gb18030.uChars, tests[i]), findIdxAlternative(codec.gb18030.uChars, tests[i]), tests[i]);
    });

    function swapBytes(buf) { for (var i = 0; i < buf.length; i+=2) buf.writeUInt16LE(buf.readUInt16BE(i), i); return buf; }
    function spacify4(str) { return str.replace(/(....)/g, "$1 ").trim(); }
    function strToHex(str) { return spacify4(swapBytes(new Buffer(str, 'ucs2')).toString('hex')); }

    it("GB18030 encodes/decodes 4 byte sequences", function() {
        var chars = {
            "\u0080": new Buffer([0x81, 0x30, 0x81, 0x30]),
            "\u0081": new Buffer([0x81, 0x30, 0x81, 0x31]),
            "\u008b": new Buffer([0x81, 0x30, 0x82, 0x31]),
            "\u0615": new Buffer([0x81, 0x31, 0x82, 0x31]),
            "\u399f": new Buffer([0x82, 0x31, 0x82, 0x31]),
            "\udbd9\ude77": new Buffer([0xE0, 0x31, 0x82, 0x31]),
        };
        for (var uChar in chars) {
            var gbkBuf = chars[uChar];
            assert.strictEqual(iconv.encode(uChar, "GB18030").toString('hex'), gbkBuf.toString('hex'));
            assert.strictEqual(strToHex(iconv.decode(gbkBuf, "GB18030")), strToHex(uChar));
        }
    });

    it("GB18030 correctly decodes incomplete 4 byte sequences", function() {
        var chars = {
            "�": new Buffer([0x82]),
            "�1": new Buffer([0x82, 0x31]),
            "�1�": new Buffer([0x82, 0x31, 0x82]),
            "\u399f": new Buffer([0x82, 0x31, 0x82, 0x31]),
            "� ": new Buffer([0x82, 0x20]),
            "�1 ": new Buffer([0x82, 0x31, 0x20]),
            "�1� ": new Buffer([0x82, 0x31, 0x82, 0x20]),
            "\u399f ": new Buffer([0x82, 0x31, 0x82, 0x31, 0x20]),
            "�1\u4fdb": new Buffer([0x82, 0x31, 0x82, 0x61]),
            "�1\u5010\u0061": new Buffer([0x82, 0x31, 0x82, 0x82, 0x61]),
            "\u399f\u4fdb": new Buffer([0x82, 0x31, 0x82, 0x31, 0x82, 0x61]),
            "�1\u50101�1": new Buffer([0x82, 0x31, 0x82, 0x82, 0x31, 0x82, 0x31]),
        };
        for (var uChar in chars) {
            var gbkBuf = chars[uChar];
            assert.strictEqual(strToHex(iconv.decode(gbkBuf, "GB18030")), strToHex(uChar));
        }
    });

});
