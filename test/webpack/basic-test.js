"use strict";

const assert = require("assert").strict;

describe("iconv-lite", function () {
    let iconv;

    it("can be require-d successfully", function () {
        // Emulate more complex environments that are both web- and node.js-compatible (e.g. Electron renderer process).
        // See https://github.com/ashtuchkin/iconv-lite/issues/204 for details.
        process.versions.node = "12.0.0";

        iconv = require("iconv-lite");
    });

    it("does not support streams by default", function () {
        assert(!iconv.supportsStreams);

        assert.throws(function () {
            iconv.encodeStream();
        }, /Streaming API is not enabled/);
    });

    it("can encode/decode sbcs encodings", function () {
        const buf = iconv.encode("abc", "win1251");
        const str = iconv.decode(buf, "win1251");
        assert.equal(str, "abc");
    });

    it("can encode/decode dbcs encodings", function () {
        const buf = iconv.encode("abc", "shiftjis");
        const str = iconv.decode(buf, "shiftjis");
        assert.equal(str, "abc");
    });

    it("can encode/decode internal encodings", function () {
        const buf = iconv.encode("💩", "utf8");
        const str = iconv.decode(buf, "utf8");
        assert.equal(str, "💩");
    });

    it("supports passing Uint8Array to decode for all encodings", function () {
        iconv.encode("", "utf8"); // Load all encodings.

        const encodings = Object.keys(iconv.encodings);
        encodings
            .filter(
                (encoding) =>
                    !encoding.startsWith("_") &&
                    // https://github.com/ashtuchkin/iconv-lite/issues/231
                    encoding !== "base64" &&
                    encoding !== "hex"
            )
            .forEach(function (encoding) {
                const expected = "Lorem ipsum";

                const encoded = iconv.encode(expected, encoding);
                const uint8Array = Uint8Array.from(encoded);

                const actual = iconv.decode(uint8Array, encoding);
                assert.equal(actual, expected, encoding);
            });
    });
});

describe("stream module", function () {
    it("is not included in the bundle", function () {
        const stream_module_name = "stream";
        assert.throws(function () {
            return require(stream_module_name);
        }, /Cannot find module 'stream'/);
    });
});
