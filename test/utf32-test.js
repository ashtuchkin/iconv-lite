var assert = require('assert'),
    iconv = require(__dirname+'/../');

var testStr = '1aя中文☃💩',
    testStr2 = '❝Stray high \uD977😱 and low\uDDDD☔ surrogate values.❞';
    utf32leBuf = Buffer.from([0x31, 0x00, 0x00, 0x00, 0x61, 0x00, 0x00, 0x00, 0x4F, 0x04, 0x00, 0x00,
        0x2D, 0x4E, 0x00, 0x00, 0x87, 0x65, 0x00, 0x00, 0x03, 0x26, 0x00, 0x00, 0xA9, 0xF4, 0x01, 0x00]),
    utf32beBuf = Buffer.from([0x00, 0x00, 0x00, 0x31, 0x00, 0x00, 0x00, 0x61, 0x00, 0x00, 0x04, 0x4F,
        0x00, 0x00, 0x4E, 0x2D, 0x00, 0x00, 0x65, 0x87, 0x00, 0x00, 0x26, 0x03, 0x00, 0x01, 0xF4, 0xA9]),
    utf32leBOM = Buffer.from([0xFF, 0xFE, 0x00, 0x00]),
    utf32beBOM = Buffer.from([0x00, 0x00, 0xFE, 0xFF]),
    sampleStr = '<?xml version="1.0" encoding="UTF-8"?>\n<俄语>данные</俄语>';

describe('UTF-32LE codec', function() {
    it('encodes basic strings correctly', function() {
        assert.equal(iconv.encode(testStr, 'UTF32-LE').toString('hex'), utf32leBuf.toString('hex'));
    });

    it('decodes basic buffers correctly', function() {
        assert.equal(iconv.decode(utf32leBuf, 'UTF32-LE'), testStr);
    });

    it('decodes uneven length buffers with no error', function() {
        assert.equal(iconv.decode(new Buffer([0x61, 0, 0, 0, 0]), 'UTF32-LE'), 'a');
    });

    it('handles invalid surrogates gracefully', function() {
        var encoded = iconv.encode(testStr2, 'UTF32-LE');
        assert.equal(iconv.decode(encoded, 'UTF32-LE'), testStr2);
    });
});

describe('UTF-32LE encoder', function() {
    it('Adds BOM when encoding', function() {
        // assert.equal(iconv.encode(testStr, 'utf-32le').toString('hex'), utf32leBOM.toString('hex') + utf32leBuf.toString('hex'));
    });
});

describe('UTF-32BE codec', function() {
    it('encodes basic strings correctly', function() {
        assert.equal(iconv.encode(testStr, 'UTF32-BE').toString('hex'), utf32beBuf.toString('hex'));
    });

    it('decodes basic buffers correctly', function() {
        assert.equal(iconv.decode(utf32beBuf, 'UTF32-BE'), testStr);
    });

    it('decodes uneven length buffers with no error', function() {
        assert.equal(iconv.decode(new Buffer([0, 0, 0, 0x61, 0]), 'UTF32-BE'), 'a');
    });

    it('handles invalid surrogates gracefully', function() {
        var encoded = iconv.encode(testStr2, 'UTF32-BE');
        assert.equal(iconv.decode(encoded, 'UTF32-BE'), testStr2);
    });
});

describe('UTF-32BE encoder', function() {
    it('Adds BOM when encoding', function() {
        // assert.equal(iconv.encode(testStr, 'utf-32be').toString('hex'), utf32beBOM.toString('hex') + utf32beBuf.toString('hex'));
    });
});

// describe('UTF-32BE decoder', function() {
// });

// describe('UTF-32 decoder', function() {
//     it('uses BOM to determine encoding', function() {
//         assert.equal(iconv.decode(Buffer.concat([utf16leBOM, utf16leBuf]), 'utf-16'), testStr);
//         assert.equal(iconv.decode(Buffer.concat([utf16beBOM, utf16beBuf]), 'utf-16'), testStr);
//     });
//
//     it('handles very short buffers nicely', function() {
//         assert.equal(iconv.decode(new Buffer([]), 'utf-16'), '');
//         assert.equal(iconv.decode(new Buffer([0x61]), 'utf-16'), '');
//     });
//
//     it('uses spaces when there is no BOM to determine encoding', function() {
//         assert.equal(iconv.decode(iconv.encode(sampleStr, 'utf-16le'), 'utf-16'), sampleStr);
//         assert.equal(iconv.decode(iconv.encode(sampleStr, 'utf-16be'), 'utf-16'), sampleStr);
//     });
//
//     it('uses UTF-16LE if no BOM and heuristics failed', function() {
//         assert.equal(iconv.decode(utf16leBuf, 'utf-16'), testStr);
//     });
//
//     it('can be given a different default encoding', function() {
//         assert.equal(iconv.decode(utf16leBuf, 'utf-16', {default: 'utf-16le'}), testStr);
//     });
// });
