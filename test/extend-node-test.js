var assert = require('assert'),
    iconv = require(__dirname+'/../'),
    fs = require('fs');

describe("Extend Node native encodings", function() {

    if (!iconv.supportsNodeEncodingsExtension)
        return;

    before(function() {
        assert.throws(function() { new Buffer().toString("windows-1251"); });
        if (Buffer.isEncoding) // Node v0.8 doesn't have this method.
            assert(!Buffer.isEncoding("windows-1251"));

        iconv.extendNodeEncodings();

        if (Buffer.isEncoding)
            assert(Buffer.isEncoding("windows-1251"));
    });

    after(function() {
        iconv.undoExtendNodeEncodings();
        
        assert.throws(function() { new Buffer().toString("windows-1251"); });
        if (Buffer.isEncoding)
            assert(!Buffer.isEncoding("windows-1251"));
    })

    it("SlowBuffer is supported", function() {
        var SlowBuffer = require('buffer').SlowBuffer;
        var buf = new SlowBuffer(10);
        
        assert.equal(buf.write("hello world", "windows-1251"), 10);
        assert.equal(buf.toString(), "hello worl");

        assert.equal(buf.write("hello world", 2, "windows-1251"), 8);
        assert.equal(buf.toString(), "hehello wo");

        assert.equal(buf.write("abcde abcde", 3, 4, "windows-1251"), 4);
        assert.equal(buf.toString(), "hehabcd wo");

        assert.equal(buf.write("活洽派洶洛泵洹洧", 1, "big5"), 9);
        assert.equal(buf.toString('big5'), "h活洽派洶�"); // TODO: the following line is more correct.
        //assert.equal(buf.toString('big5'), "h活洽派洶o");

        // TODO: Set _charsWritten.
    });

    it("Buffer is supported", function() {
        var buf = new Buffer("abcdeabcde", "windows-1251");
        assert.equal(buf.toString(), "abcdeabcde");

        assert.equal(buf.write("hello world", "windows-1251"), 10);
        assert.equal(buf.toString(), "hello worl");

        assert.equal(buf.write("hello world", 2, "windows-1251"), 8);
        assert.equal(buf.toString(), "hehello wo");

        assert.equal(buf.write("abcde abcde", 3, 4, "windows-1251"), 4);
        assert.equal(buf.toString(), "hehabcd wo");

        assert.equal(buf.write("活洽派洶洛泵洹洧", 1, "big5"), 9);
        assert.equal(buf.toString('big5'), "h活洽派洶�"); // TODO: the following line is more correct.
        //assert.equal(buf.toString('big5'), "h活洽派洶o");

        assert.equal(Buffer.byteLength("活洽派洶洛泵洹洧", 'big5'), 16);
        if (Buffer.isEncoding)
            assert(Buffer.isEncoding("windows-1251"));

        // TODO: Set _charsWritten.
    });

    if (iconv.supportsStreams) {
        // Marker: å∫ç∂  (don't delete this comment - it is read by tests below)
        var markerInWin1251 = 'ГҐв€«'+'Г§в€‚';

        it("Readable#setEncoding()", function(done) {
            var readStream = fs.createReadStream(__filename);
            readStream.setEncoding('windows-1251');
            readStream.on('data', function(str) {
                assert.equal(typeof str, 'string');
                assert.notEqual(str.indexOf(markerInWin1251), -1);
            });
            readStream.on('end', done);
        });

        it("Readable#setEncoding() and collect", function(done) {
            fs.createReadStream(__filename, {encoding: "win1251"}).collect(function(err, str) {
                assert.ifError(err);
                assert.equal(typeof str, 'string');
                assert.notEqual(str.indexOf(markerInWin1251), -1);
                done();
            });
        });

        it("HTTP and Request example", function(done) {
            var http = require('http'),
                request = require('request'),
                port = 33000,
                testStr = "Ах, как внезапно кончился диван!";

            var server = http.createServer(function(req, res) {
                req.setEncoding('win1251');
                req.collect(function(err, body) {
                    assert.ifError(err);
                    assert.equal(body, testStr);
                    body = iconv.encode(body, 'koi8-r')
                    assert.notEqual(body.toString(), testStr);
                    res.end(body);
                });

            }).listen(port, function() {
                var body = new Buffer(testStr, 'win1251');
                assert.notEqual(body.toString(), testStr);
                request({
                    url: "http://localhost:"+port,
                    encoding: 'koi8-r',
                    body: body,
                }, function(err, resp, body) {
                    assert.ifError(err);
                    assert.equal(body, testStr);                
                    server.close(done);
                });
            });
        });
    }
});

