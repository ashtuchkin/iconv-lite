"use strict";

const assert = require("assert"),
    utils = require("./utils"),
    iconv = utils.requireIconv();

describe("ShiftJIS tests #node-web", function () {
    it("ShiftJIS correctly encoded/decoded", function () {
        const testString = "中文abc", //unicode contains ShiftJIS-code and ascii
            testStringBig5Buffer = utils.bytes("92 86 95 b6 61 62 63"),
            testString2 = "測試",
            testStringBig5Buffer2 = utils.bytes("91 aa 8e 8e");

        assert.strictEqual(
            utils.hex(iconv.encode(testString, "shiftjis")),
            utils.hex(testStringBig5Buffer)
        );
        assert.strictEqual(iconv.decode(testStringBig5Buffer, "shiftjis"), testString);
        assert.strictEqual(
            utils.hex(iconv.encode(testString2, "shiftjis")),
            utils.hex(testStringBig5Buffer2)
        );
        assert.strictEqual(iconv.decode(testStringBig5Buffer2, "shiftjis"), testString2);
    });

    it("ShiftJIS extended chars are decoded, but not encoded", function () {
        const buf = utils.bytes("ed 40 ee fc ee ef"),
            str = "纊＂ⅰ",
            res = "fa 5c fa 57 fa 40", // repeated block (these same chars are repeated in the different place)
            buf2 = utils.bytes("f0 40 f2 fc f9 40"),
            str2 = "",
            res2 = "3f 3f 3f"; // non-repeated, UA block.

        assert.strictEqual(iconv.decode(buf, "shiftjis"), str);
        assert.strictEqual(iconv.decode(buf2, "shiftjis"), str2);

        assert.strictEqual(utils.hex(iconv.encode(str, "shiftjis")), res);
        assert.strictEqual(utils.hex(iconv.encode(str2, "shiftjis")), res2);
    });

    it("ShiftJIS includes extensions", function () {
        assert.strictEqual(iconv.decode(utils.bytes("87 40"), "shiftjis"), "①");
        assert.strictEqual(utils.hex(iconv.encode("①", "shiftjis")), "87 40");
    });
});
