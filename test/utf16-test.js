var assert = require('assert'),
    utils = require('./utils'),
    iconv = utils.requireIconv(),
    hex = utils.hex;

var testStr = "1aя中文☃💩";
    utf16beBuf = utils.bytesFrom([0, 0x31, 0, 0x61, 0x04, 0x4f, 0x4e, 0x2d, 0x65, 0x87, 0x26, 0x03, 0xd8, 0x3d, 0xdc, 0xa9]),
    utf16leBuf = utils.bytesFrom([0x31, 0, 0x61, 0, 0x4f, 0x04, 0x2d, 0x4e, 0x87, 0x65, 0x03, 0x26, 0x3d, 0xd8, 0xa9, 0xdc]),
    utf16beBOM = utils.bytesFrom([0xFE, 0xFF]),
    utf16leBOM = utils.bytesFrom([0xFF, 0xFE]),
    sampleStr = '<?xml version="1.0" encoding="UTF-8"?>\n<俄语>данные</俄语>';

describe("UTF-16LE codec #node-web", function() {
    it("decodes very short buffers correctly", function() {
        assert.equal(iconv.decode(utils.bytesFrom([]), 'utf-16le'), '');
        
        // Looks like StringDecoder doesn't do the right thing here, returning '\u0000'. TODO: fix.
        //assert.equal(iconv.decode(utils.bytesFrom([0x61]), 'utf-16le'), '');
    });
});

describe("UTF-16BE codec #node-web", function() {
    it("encodes basic strings correctly", function() {
        assert.equal(hex(iconv.encode(testStr, 'utf16-be')), hex(utf16beBuf));
    });

    it("decodes basic buffers correctly", function() {
        assert.equal(iconv.decode(utf16beBuf, 'utf16-be'), testStr);
    });

    it("decodes uneven length buffers with no error", function() {
        assert.equal(iconv.decode(utils.bytesFrom([0, 0x61, 0]), 'utf16-be'), "a");
    });

    it("decodes very short buffers correctly", function() {
        assert.equal(iconv.decode(utils.bytesFrom([]), 'utf-16be'), '');
        assert.equal(iconv.decode(utils.bytesFrom([0x61]), 'utf-16be'), '');
    });
});

describe("UTF-16 encoder #node-web", function() {
    it("uses UTF-16LE and adds BOM when encoding", function() {
        assert.equal(hex(iconv.encode(testStr, "utf-16")), hex(utf16leBOM) + hex(utf16leBuf));
    });

    it("can skip BOM", function() {
        assert.equal(hex(iconv.encode(testStr, "utf-16", {addBOM: false})), hex(utf16leBuf));
    });

    it("can use other encodings, for example UTF-16BE, with BOM", function() {
        assert.equal(hex(iconv.encode(testStr, "utf-16", {use: 'UTF-16BE'})), hex(utf16beBOM) + hex(utf16beBuf));
    });
});

describe("UTF-16 decoder #node-web", function() {
    it("uses BOM to determine encoding", function() {
        assert.equal(iconv.decode(utils.concatBufs([utf16leBOM, utf16leBuf]), "utf-16"), testStr);
        assert.equal(iconv.decode(utils.concatBufs([utf16beBOM, utf16beBuf]), "utf-16"), testStr);
    });

    it("handles very short buffers", function() {
        assert.equal(iconv.decode(utils.bytesFrom([]), 'utf-16'), '');

        // Looks like StringDecoder doesn't do the right thing here. TODO: fix.
        //assert.equal(iconv.decode(utils.bytesFrom([0x61]), 'utf-16'), '');
    });

    it("uses spaces when there is no BOM to determine encoding", function() {
        assert.equal(iconv.decode(iconv.encode(sampleStr, 'utf-16le'), 'utf-16'), sampleStr);
        assert.equal(iconv.decode(iconv.encode(sampleStr, 'utf-16be'), 'utf-16'), sampleStr);
    });

    it("uses UTF-16LE if no BOM and heuristics failed", function() {
        assert.equal(iconv.decode(utf16leBuf, 'utf-16'), testStr);
    });

    it("can be given a different default encoding", function() {
        assert.equal(iconv.decode(utf16leBuf, 'utf-16', {default: 'utf-16le'}), testStr);
    });
});
