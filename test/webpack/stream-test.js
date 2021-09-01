"use strict";

const assert = require("assert").strict;

describe("iconv-lite with streams", function () {
    const iconv = require("iconv-lite");

    it("supports streams when explicitly enabled", function () {
        iconv.enableStreamingAPI(require("stream"));
        assert(iconv.supportsStreams);
    });

    it("can encode/decode in streaming mode", function (done) {
        const stream1 = iconv.encodeStream("win1251");
        const stream2 = iconv.decodeStream("win1251");
        stream1.pipe(stream2);

        stream1.end("abc");
        stream2.collect(function (err, str) {
            if (err) {
                done(err);
                return;
            }

            assert.equal(str, "abc");
            done(null);
        });
    });
});
