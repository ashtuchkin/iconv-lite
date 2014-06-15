var assert = require('assert'),
    iconv = require(__dirname+'/../');

var testStr = "1aя中文☃💩";
    utf16beBuf = new Buffer([0, 0x31, 0, 0x61, 0x04, 0x4f, 0x4e, 0x2d, 0x65, 0x87, 0x26, 0x03, 0xd8, 0x3d, 0xdc, 0xa9]),
    utf16leBuf = new Buffer(testStr, 'ucs2'),
    utf16beBOM = new Buffer([0xFE, 0xFF]),
    utf16leBOM = new Buffer([0xFF, 0xFE]),
    sampleStr = '<?xml version="1.0" encoding="UTF-8"?>\n<俄语>данные</俄语>';

describe("UTF-16BE codec", function() {
    it("encodes basic strings correctly", function() {
        assert.equal(iconv.encode(testStr, 'UTF16-BE').toString('hex'), utf16beBuf.toString('hex'));
    });

    it("decodes basic buffers correctly", function() {
        assert.equal(iconv.decode(utf16beBuf, 'UTF16-BE'), testStr);
    });

    it("decodes uneven length buffers with no error", function() {
        assert.equal(iconv.decode(new Buffer([0, 0x61, 0]), 'UTF16-BE'), "a");
    });
});

describe("UTF-16 encoder", function() {
    it("uses UTF-16BE and adds BOM when encoding", function() {
        assert.equal(iconv.encode(testStr, "utf-16").toString('hex'), utf16beBOM.toString('hex') + utf16beBuf.toString('hex'));
    });

    it("can use other encodings, for example UTF-16LE, with BOM", function() {
        assert.equal(iconv.encode(testStr, "utf-16", {use: 'UTF-16LE'}).toString('hex'), 
            utf16leBOM.toString('hex') + new Buffer(testStr, 'ucs2').toString('hex'));
    });
});

describe("UTF-16 decoder", function() {
    it("uses BOM to determine encoding", function() {
        assert.equal(iconv.decode(Buffer.concat([utf16leBOM, utf16leBuf]), "utf-16"), testStr);
        assert.equal(iconv.decode(Buffer.concat([utf16beBOM, utf16beBuf]), "utf-16"), testStr);
    });

    it("handles very short buffers nice", function() {
        assert.equal(iconv.decode(new Buffer([]), 'utf-16'), '');
        assert.equal(iconv.decode(new Buffer([0x61]), 'utf-16'), '');
    });

    it("uses spaces when there is no BOM to determine encoding", function() {
        assert.equal(iconv.decode(iconv.encode(sampleStr, 'utf-16le'), 'utf-16'), sampleStr);
        assert.equal(iconv.decode(iconv.encode(sampleStr, 'utf-16be'), 'utf-16'), sampleStr);
    });

    it("uses UTF-16BE if no BOM and heuristics failed", function() {
        assert.equal(iconv.decode(utf16beBuf, 'utf-16'), testStr);
    });

    it("can be given a different default encoding", function() {
        assert.equal(iconv.decode(utf16leBuf, 'utf-16', {default: 'utf-16le'}), testStr);
    });
});