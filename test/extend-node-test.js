var assert = require('assert'),
    iconv = require(__dirname+'/../'),
    fs = require('fs');

describe("Extend Node native encodings", function() {
    before(function() {
        assert.throws(function() { new Buffer().toString("windows-1251"); });
        if (Buffer.isEncoding) // Node v0.8 doesn't have this method.
            assert(!Buffer.isEncoding("windows-1251"));

        iconv.extendNodeEncodings();
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
        it("Readable#setEncoding()", function(done) {
            var readStream = fs.createReadStream(__filename);
            readStream.setEncoding('windows-1251');
            readStream.on('data', function(str) {
                assert(typeof str == 'string');
            });
            readStream.on('end', done);
        });

        it("Readable#setEncoding() and collect", function(done) {
            fs.createReadStream(__filename, "big5").collect(function(err, str) {
                assert.ifError(err);
                assert(typeof str == 'string');
                var marker = "銝Ｖ葫銋册飾鈭窍滌隞"; // big5 to utf8 of "丢丬乕乢亊亰" <- don't delete this comment. it is the marker.
                assert(str.indexOf(marker) != -1); 
                done();
            });
        });

        it("HTTP and Request example", function(done) {
            var http = require('http'),
                request = require('request'),
                port = 33000,
                testStr = "唨唩唫唭唲唴唵唶唸";

            var server = http.createServer(function(req, res) {
                req.setEncoding('gbk');
                req.collect(function(err, body) {
                    res.end(iconv.encode(body, 'cp936'));
                });

            }).listen(33000, function() {
                request({
                    url: "http://localhost:"+port,
                    encoding: 'cp936',
                    body: new Buffer(testStr, 'gbk'),
                }, function(err, resp, body) {
                    assert.equal(body, testStr);                
                    done();
                });
            });

            setTimeout(function() {
                server.close();
            }, 300);
        });
    }
});

