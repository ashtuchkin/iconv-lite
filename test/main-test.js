var assert = require('assert'),
    iconv = require(__dirname+'/../');

var testString = "Hello123!";
var testStringLatin1 = "Hello123!£Å÷×çþÿ¿®";
var testStringBase64 = "SGVsbG8xMjMh";
var testStringHex = "48656c6c6f31323321";

describe("Generic UTF8-UCS2 tests", function() {
    
    it("Return values are of correct types", function() {
        assert.ok(iconv.encode(testString, "utf8") instanceof Buffer);
        
        var s = iconv.decode(new Buffer(testString), "utf8");
        assert.strictEqual(Object.prototype.toString.call(s), "[object String]");
    });

    it("Internal encodings all correctly encoded/decoded", function() {
        ['utf8', "UTF-8", "UCS2", "binary"].forEach(function(enc) {
            assert.strictEqual(iconv.encode(testStringLatin1, enc).toString(enc), testStringLatin1);
            assert.strictEqual(iconv.decode(new Buffer(testStringLatin1, enc), enc), testStringLatin1);
        });
    });

    it("Base64 correctly encoded/decoded", function() {    
        assert.strictEqual(iconv.encode(testStringBase64, "base64").toString("binary"), testString);
        assert.strictEqual(iconv.decode(new Buffer(testString, "binary"), "base64"), testStringBase64);
    });

    it("Hex correctly encoded/decoded", function() {    
        assert.strictEqual(iconv.encode(testStringHex, "hex").toString("binary"), testString);
        assert.strictEqual(iconv.decode(new Buffer(testString, "binary"), "hex"), testStringHex);
    });
    
    it("Latin1 correctly encoded/decoded", function() {    
        assert.strictEqual(iconv.encode(testStringLatin1, "latin1").toString("binary"), testStringLatin1);
        assert.strictEqual(iconv.decode(new Buffer(testStringLatin1, "binary"), "latin1"), testStringLatin1);
    });
    
    it("Convert to string, not buffer (utf8 used)", function() {
        var res = iconv.encode(new Buffer(testStringLatin1, "utf8"), "utf8");
        assert.ok(res instanceof Buffer);
        assert.strictEqual(res.toString("utf8"), testStringLatin1);
    });
    
    it("Throws on unknown encodings", function() {
        assert.throws(function() { iconv.encode("a", "xxx"); });
        assert.throws(function() { iconv.decode(new Buffer("a"), "xxx"); });
    });
    
    it("Convert non-strings and non-buffers", function() {
        assert.strictEqual(iconv.encode({}, "utf8").toString(), "[object Object]");
        assert.strictEqual(iconv.encode(10, "utf8").toString(), "10");
        assert.strictEqual(iconv.encode(undefined, "utf8").toString(), "");
    });
    
    it("Aliases toEncoding and fromEncoding work the same as encode and decode", function() {
        assert.strictEqual(iconv.toEncoding(testString, "latin1").toString("binary"), iconv.encode(testString, "latin1").toString("binary"));
        assert.strictEqual(iconv.fromEncoding(new Buffer(testStringLatin1), "latin1"), iconv.decode(new Buffer(testStringLatin1), "latin1"));
    });

    it("handles Object & Array prototypes monkey patching", function() {
        Object.prototype.permits = function() {};
        Array.prototype.sample2 = function() {};

        iconv._codecDataCache = {}; // Clean up cache so that all encodings are loaded.

        assert.strictEqual(iconv.decode(new Buffer("abc"), "gbk"), "abc");
        assert.strictEqual(iconv.decode(new Buffer("abc"), "win1251"), "abc");
        assert.strictEqual(iconv.decode(new Buffer("abc"), "utf7"), "abc");
        assert.strictEqual(iconv.decode(new Buffer("abc"), "utf8"), "abc");

        assert.strictEqual(iconv.encode("abc", "gbk").toString(), "abc");
        assert.strictEqual(iconv.encode("abc", "win1251").toString(), "abc");
        assert.strictEqual(iconv.encode("abc", "utf7").toString(), "abc");
        assert.strictEqual(iconv.encode("abc", "utf8").toString(), "abc");

        delete Object.prototype.permits;
        delete Array.prototype.sample2;
    });
    
    it('Internal encodings has correct length in bytes', function() {
        assert.equal(iconv.byteLength(testStringLatin1, 'utf8'), Buffer.byteLength(testStringLatin1, 'utf8'));
        assert.equal(iconv.byteLength(testStringLatin1, 'ucs2'), Buffer.byteLength(testStringLatin1, 'ucs2'));
        assert.equal(iconv.byteLength(testStringLatin1, 'binary'), Buffer.byteLength(testStringLatin1, 'binary'));
        assert.equal(iconv.byteLength(testStringBase64, 'base64'), Buffer.byteLength(testStringBase64, 'base64'));
        assert.equal(iconv.byteLength(testStringHex, 'hex'), Buffer.byteLength(testStringHex, 'hex'));
    });
});
