"use strict";

var assert = require("assert"),
    utils = require("./utils"),
    iconv = utils.requireIconv();

var testString = "中文abc", //unicode contains Big5-code and ascii
    testStringBig5Buffer = utils.bytes("a4 a4 a4 e5 61 62 63"),
    testString2 = "測試",
    testStringBig5Buffer2 = utils.bytes("b4 fa b8 d5");

describe("Big5 tests", function () {
    it("Big5 correctly encoded/decoded", function () {
        assert.strictEqual(
            utils.hex(iconv.encode(testString, "big5")),
            utils.hex(testStringBig5Buffer)
        );
        assert.strictEqual(iconv.decode(testStringBig5Buffer, "big5"), testString);
        assert.strictEqual(
            utils.hex(iconv.encode(testString2, "big5")),
            utils.hex(testStringBig5Buffer2)
        );
        assert.strictEqual(iconv.decode(testStringBig5Buffer2, "big5"), testString2);
    });

    it("cp950 correctly encoded/decoded", function () {
        assert.strictEqual(
            utils.hex(iconv.encode(testString, "cp950")),
            utils.hex(testStringBig5Buffer)
        );
        assert.strictEqual(iconv.decode(testStringBig5Buffer, "cp950"), testString);
    });

    it("Big5 file read decoded,compare with iconv result", function () {
        var contentBuffer = Buffer.from(
            "PEhUTUw+DQo8SEVBRD4gICAgDQoJPFRJVExFPiBtZXRhILzQxdKquqjPpc6hR6SkpOW69K22IDwvVElUTEU+DQoJPG1ldGEgSFRUUC1FUVVJVj0iQ29udGVudC1UeXBlIiBDT05URU5UPSJ0ZXh0L2h0bWw7IGNoYXJzZXQ9YmlnNSI+DQo8L0hFQUQ+DQo8Qk9EWT4NCg0Ks2+sT6RArdPBY8XppKSk5br0rbahSTxicj4NCihUaGlzIHBhZ2UgdXNlcyBiaWc1IGNoYXJhY3RlciBzZXQuKTxicj4NCmNoYXJzZXQ9YmlnNQ0KDQo8L0JPRFk+DQo8L0hUTUw+",
            "base64"
        );
        var str = iconv.decode(contentBuffer, "big5");
        var iconvc = new (require("iconv").Iconv)("big5", "utf8");
        assert.strictEqual(iconvc.convert(contentBuffer).toString(), str);
    });

    it("Big5 correctly decodes and encodes characters · and ×", function () {
        // https://github.com/ashtuchkin/iconv-lite/issues/13
        // Reference: http://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP950.TXT
        var chars = "·×";
        var big5Chars = utils.bytes("a1 50 a1 d1");
        assert.strictEqual(utils.hex(iconv.encode(chars, "big5")), utils.hex(big5Chars));
        assert.strictEqual(iconv.decode(big5Chars, "big5"), chars);
    });

    it("Big5 correctly encodes & decodes sequences", function () {
        assert.strictEqual(utils.hex(iconv.encode("\u00CA\u0304", "big5")), "88 62");
        assert.strictEqual(utils.hex(iconv.encode("\u00EA\u030C", "big5")), "88 a5");
        assert.strictEqual(utils.hex(iconv.encode("\u00CA", "big5")), "88 66");
        assert.strictEqual(utils.hex(iconv.encode("\u00CA\u00CA", "big5")), "88 66 88 66");

        assert.strictEqual(utils.hex(iconv.encode("\u00CA\uD800", "big5")), "88 66 3f"); // Unfinished surrogate.
        assert.strictEqual(utils.hex(iconv.encode("\u00CA\uD841\uDD47", "big5")), "88 66 fa 40"); // Finished surrogate ('𠕇').
        assert.strictEqual(utils.hex(iconv.encode("\u00CA𠕇", "big5")), "88 66 fa 40"); // Finished surrogate ('𠕇').

        assert.strictEqual(iconv.decode(utils.bytes("88 62"), "big5"), "\u00CA\u0304");
        assert.strictEqual(iconv.decode(utils.bytes("88 66"), "big5"), "\u00CA");
        assert.strictEqual(iconv.decode(utils.bytes("88 66 fa 40"), "big5"), "\u00CA𠕇");
    });

    it("Big5 correctly encodes 十", function () {
        assert.strictEqual(utils.hex(iconv.encode("十", "big5")), "a4 51");
    });
});
