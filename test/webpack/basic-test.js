var assert = require('assert').strict;

describe("iconv-lite", function() {
    var iconv;

    it("can be require-d successfully", function() {
        // Emulate more complex environments that are both web- and node.js-compatible (e.g. Electron renderer process).
        // See https://github.com/ashtuchkin/iconv-lite/issues/204 for details.
        process.versions.node = "12.0.0";

        iconv = require(".").iconv;
    });

    it("does not support streams by default", function() {
        assert(!iconv.supportsStreams);

        assert.throws(function() { 
            iconv.encodeStream()
        }, /Streaming API is not enabled/);
    });

    it("can encode/decode sbcs encodings", function() {
        var buf = iconv.encode("abc", "win1251");
        var str = iconv.decode(buf, "win1251");
        assert.equal(str, "abc");
    });

    it("can encode/decode dbcs encodings", function() {
        var buf = iconv.encode("abc", "shiftjis");
        var str = iconv.decode(buf, "shiftjis");
        assert.equal(str, "abc");
    });

    it("can encode/decode internal encodings", function() {
        var buf = iconv.encode("💩", "utf8");
        var str = iconv.decode(buf, "utf8");
        assert.equal(str, "💩");
    });

    [
        'utf8',
        'utf16le',
        'utf16be',
        'ucs2',
        'binary',
        'latin1',
        'big5',
        'gbk',
        'cesu8',
        'shiftjis',
        'cp1251',
        'cp1253',
        'cp1254',
        'armscii8'
    ].forEach(function(encoding) {
        it("supports Uint8Array for " + encoding, function() {
            var expected = 'Lorem ipsum';

            var encoded = iconv.encode(expected, encoding);
            var byteArray = [];
            for (var i = 0; i < encoded.length; i++) {
                byteArray[i] = encoded[i];
            }
            const uint8Array = Uint8Array.from(byteArray);

            var actual = iconv.decode(uint8Array, encoding);
            assert.equal(actual, expected);
        });
    });
});

describe("stream module", function() {
    it("is not included in the bundle", function() {
        var stream_module_name = "stream";
        assert.throws(function() { return require(stream_module_name) }, /Cannot find module 'stream'/);
    });
});