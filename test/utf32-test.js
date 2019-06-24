var assert = require('assert'),
    iconv = require(__dirname+'/../');

var testStr = '1aя中文☃💩',
    testStr2 = '❝Stray high \uD977😱 and low\uDDDD☔ surrogate values.❞',
    utf32leBuf = Buffer.from([0x31, 0x00, 0x00, 0x00, 0x61, 0x00, 0x00, 0x00, 0x4F, 0x04, 0x00, 0x00,
        0x2D, 0x4E, 0x00, 0x00, 0x87, 0x65, 0x00, 0x00, 0x03, 0x26, 0x00, 0x00, 0xA9, 0xF4, 0x01, 0x00]),
    utf32beBuf = Buffer.from([0x00, 0x00, 0x00, 0x31, 0x00, 0x00, 0x00, 0x61, 0x00, 0x00, 0x04, 0x4F,
        0x00, 0x00, 0x4E, 0x2D, 0x00, 0x00, 0x65, 0x87, 0x00, 0x00, 0x26, 0x03, 0x00, 0x01, 0xF4, 0xA9]),
    utf32leBOM = Buffer.from([0xFF, 0xFE, 0x00, 0x00]),
    utf32beBOM = Buffer.from([0x00, 0x00, 0xFE, 0xFF]),
    utf32leBufWithBOM = Buffer.concat([utf32leBOM, utf32leBuf]),
    utf32beBufWithBOM = Buffer.concat([utf32beBOM, utf32beBuf]),
    utf32leBufWithInvalidChar = Buffer.concat([utf32leBuf, Buffer.from([0x12, 0x34, 0x56, 0x78])]),
    utf32beBufWithInvalidChar = Buffer.concat([utf32beBuf, Buffer.from([0x12, 0x34, 0x56, 0x78])]),
    sampleStr = '<?xml version="1.0" encoding="UTF-8"?>\n<俄语>данные</俄语>';

describe('UTF-32LE codec', function() {
    it('encodes basic strings correctly', function() {
        assert.equal(iconv.encode(testStr, 'UTF32-LE').toString('hex'), utf32leBuf.toString('hex'));
    });

    it('decodes basic buffers correctly', function() {
        assert.equal(iconv.decode(utf32leBuf, 'ucs4le'), testStr);
    });

    it('decodes uneven length buffers with no error', function() {
        assert.equal(iconv.decode(new Buffer([0x61, 0, 0, 0, 0]), 'UTF32-LE'), 'a');
    });

    it('handles invalid surrogates gracefully', function() {
        var encoded = iconv.encode(testStr2, 'UTF32-LE');
        assert.equal(iconv.decode(encoded, 'UTF32-LE'), testStr2);
    });

    it('handles invalid Unicode codepoints gracefully', function() {
        assert.equal(iconv.decode(utf32leBufWithInvalidChar, 'utf-32'), testStr + '�');
    });
});

describe('UTF-32BE codec', function() {
    it('encodes basic strings correctly', function() {
        assert.equal(iconv.encode(testStr, 'UTF32-BE').toString('hex'), utf32beBuf.toString('hex'));
    });

    it('decodes basic buffers correctly', function() {
        assert.equal(iconv.decode(utf32beBuf, 'ucs4be'), testStr);
    });

    it('decodes uneven length buffers with no error', function() {
        assert.equal(iconv.decode(new Buffer([0, 0, 0, 0x61, 0]), 'UTF32-BE'), 'a');
    });

    it('handles invalid surrogates gracefully', function() {
        var encoded = iconv.encode(testStr2, 'UTF32-BE');
        assert.equal(iconv.decode(encoded, 'UTF32-BE'), testStr2);
    });

    it('handles invalid Unicode codepoints gracefully', function() {
        assert.equal(iconv.decode(utf32beBufWithInvalidChar, 'utf-32'), testStr + '�');
    });
});

describe('UTF-32 general encoder', function() {
    it('Adds BOM when encoding, defaults to UTF-32LE', function() {
        assert.equal(iconv.encode(testStr, 'utf-32').toString('hex'), utf32leBOM.toString('hex') + utf32leBuf.toString('hex'));
    });

    it('Doesn\'t add BOM and uses UTF-32BE when specified', function() {
        assert.equal(iconv.encode(testStr, 'ucs4', {addBOM: false, defaultEncoding: 'ucs4be'}).toString('hex'), utf32beBuf.toString('hex'));
    });

    it('Correctly decodes UTF-32LE using BOM', function() {
        assert.equal(iconv.decode(utf32leBufWithBOM, 'utf-32'), testStr);
    });

    it('Correctly decodes UTF-32LE without BOM', function() {
        assert.equal(iconv.decode(iconv.encode(sampleStr, 'utf-32-le'), 'utf-32'), sampleStr);
    });

    it('Correctly decodes UTF-32BE using BOM', function() {
        assert.equal(iconv.decode(utf32beBufWithBOM, 'utf-32', { stripBOM: false }), '\uFEFF' + testStr);
    });

    it('Correctly decodes UTF-32BE without BOM', function() {
        assert.equal(iconv.decode(iconv.encode(sampleStr, 'utf-32-be'), 'utf-32'), sampleStr);
    });
});
