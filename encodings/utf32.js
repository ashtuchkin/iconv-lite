'use strict';

var Buffer = require('safer-buffer').Buffer;

// == UTF32-LE codec. ==========================================================

exports.utf32le = Utf32LECodec;
exports.ucs4le = Utf32LECodec;

function Utf32LECodec(options, iconv) {
    this.iconv = iconv;
}

Utf32LECodec.prototype.encoder = Utf32LEEncoder;
Utf32LECodec.prototype.decoder = Utf32LEDecoder;
Utf32LECodec.prototype.bomAware = true;

// -- Encoding

function Utf32LEEncoder() {
    this.highSurrogate = null;
}

Utf32LEEncoder.prototype.write = function(str) {
    var src = Buffer.from(str, 'ucs2');
    var dst = Buffer.alloc(src.length * 2);
    var offset = 0;

    for (var i = 0; i < src.length; i += 2) {
        var lowByte = src[i];
        var highByte = src[i + 1];
        var isHighSurrogate = (0xD8 <= highByte && highByte < 0xDC);
        var isLowSurrogate = (0xDC <= highByte && highByte < 0xE0);

        if (this.highSurrogate) {
            if (isHighSurrogate || !isLowSurrogate) {
                // There shouldn't be two high surrogates in a row, nor a high surrogate which isn't followed by a low
                // surrogate. If this happens, keep the pending high surrogate as a stand-alone semi-invalid character
                // (technically wrong, but expected by some applications, like Windows file names).
                dst[offset++] = this.highSurrogate[0]; dst[offset++] = this.highSurrogate[1]; dst[offset++] = 0; dst[offset++] = 0;
            }
            else {
                // Create 32-bit value from high and low surrogates;
                var codepoint = (((this.highSurrogate[1] - 0xD8) << 18) | (this.highSurrogate[0] << 10) |
                    ((highByte - 0xDC) << 8) | lowByte) + 0x10000;

                dst[offset++] =  codepoint & 0x000000FF;
                dst[offset++] = (codepoint & 0x0000FF00) >> 8;
                dst[offset++] = (codepoint & 0x00FF0000) >> 16;
                dst[offset++] = (codepoint & 0xFF000000) >> 24;
                this.highSurrogate = null;

                continue;
            }
        }

        if (isHighSurrogate)
            this.highSurrogate = [lowByte, highByte];
        else {
            // Even if the current character is a low surrogate, with no previous high surrogate, we'll
            // encode it as a semi-invalid stand-alone character for the same reasons expressed above for
            // unpaired high surrogates.
            dst[offset++] = lowByte; dst[offset++] = highByte; dst[offset++] = 0; dst[offset++] = 0;
            this.highSurrogate = null;
        }
    }

    if (offset < dst.length)
        dst = dst.slice(0, offset);

    return dst;
};

Utf32LEEncoder.prototype.end = function() {
    // Treat any leftover high surrogate as a semi-valid independent character.
    if (!this.highSurrogate)
        return;

    var buf = Buffer.alloc(4);

    buf[0] = this.highSurrogate[0]; buf[1] = this.highSurrogate[1]; buf[2] = 0; buf[3] = 0;
    this.highSurrogate = null;

    return buf;
};

// -- Decoding

function Utf32LEDecoder(options, codec) {
    this.badChar = Buffer.from(codec.iconv.defaultCharUnicode, 'ucs2');
    this.overflow = null;
}

Utf32LEDecoder.prototype.write = function(src) {
    if (src.length === 0)
        return '';
    else if (this.overflow) {
        src = Buffer.concat([this.overflow, src]);
    }

    var goodLength = src.length - src.length % 4;

    if (src.length !== goodLength) {
        this.overflow = src.slice(goodLength);
        src = src.slice(0, goodLength);
    }
    else
        this.overflow = null;

    var dst = Buffer.alloc(goodLength);
    var offset = 0;

    for (var i = 0; i < goodLength; i += 4) {
        var b0 = src[i];
        var b1 = src[i + 1];
        var b2 = src[i + 2];
        var b3 = src[i + 3];

        if (b3 === 0 && b2 === 0) {
            // Simple 16-bit character
            dst[offset++] = b0; dst[offset++] = b1;
        }
        else {
            var codepoint = b3 * 0x1000000 + b2 * 0x10000 + b1 * 0x100 + b0;

            if (codepoint > 0x10FFFF) {
                // Not a valid Unicode codepoint
                dst[offset++] = this.badChar[0]; dst[offset++] = this.badChar[1];
            }
            else {
                codepoint -= 0x10000;
                var high = 0xD800 | (codepoint >> 10);
                var low = 0xDC00 + (codepoint & 0x3FF);
                dst[offset++] = high & 0xFF; dst[offset++] = high >> 8;
                dst[offset++] = low & 0xFF; dst[offset++] = low >> 8;
            }
        }
    }

    return dst.slice(0, offset).toString('ucs2');
};

Utf32LEDecoder.prototype.end = function() {
    this.overflow = null;
};

// == UTF32-BE codec. ==========================================================

exports.utf32be = Utf32BECodec;
exports.ucs4be = Utf32BECodec;

function Utf32BECodec(options, iconv) {
    this.iconv = iconv;
}

Utf32BECodec.prototype.encoder = Utf32BEEncoder;
Utf32BECodec.prototype.decoder = Utf32BEDecoder;
Utf32BECodec.prototype.bomAware = true;

// -- Encoding

function Utf32BEEncoder() {
    this.highSurrogate = null;
}

Utf32BEEncoder.prototype.write = function(str) {
    var src = Buffer.from(str, 'ucs2');
    var dst = Buffer.alloc(src.length * 2);
    var offset = 0;

    for (var i = 0; i < src.length; i += 2) {
        var lowByte = src[i];
        var highByte = src[i + 1];
        var isHighSurrogate = (0xD8 <= highByte && highByte < 0xDC);
        var isLowSurrogate = (0xDC <= highByte && highByte < 0xE0);

        if (this.highSurrogate) {
            if (isHighSurrogate || !isLowSurrogate) {
                // There shouldn't be two high surrogates in a row, nor a high surrogate which isn't followed by a low
                // surrogate. If this happens, keep the pending high surrogate as a stand-alone semi-invalid character
                // (technically wrong, but expected by some applications, like Windows file names).
                dst[offset++] = 0; dst[offset++] = 0; dst[offset++] = this.highSurrogate[1]; dst[offset++] = this.highSurrogate[0];
            }
            else {
                // Create 32-bit value from high and low surrogates;
                var codepoint = (((this.highSurrogate[1] - 0xD8) << 18) | (this.highSurrogate[0] << 10) |
                    ((highByte - 0xDC) << 8) | lowByte) + 0x10000;

                dst[offset++] = (codepoint & 0xFF000000) >> 24;
                dst[offset++] = (codepoint & 0x00FF0000) >> 16;
                dst[offset++] = (codepoint & 0x0000FF00) >> 8;
                dst[offset++] =  codepoint & 0x000000FF;
                this.highSurrogate = null;

                continue;
            }
        }

        if (isHighSurrogate)
            this.highSurrogate = [lowByte, highByte];
        else {
            // Even if the current character is a low surrogate, with no previous high surrogate, we'll
            // encode it as a semi-invalid stand-alone character for the same reasons expressed above for
            // unpaired high surrogates.
            dst[offset++] = 0; dst[offset++] = 0; dst[offset++] = highByte; dst[offset++] = lowByte;
            this.highSurrogate = null;
        }
    }

    if (offset < dst.length)
        dst = dst.slice(0, offset);

    return dst;
};

Utf32BEEncoder.prototype.end = function() {
    // Treat any leftover high surrogate as a semi-invalid independent character.
    if (!this.highSurrogate)
        return;

    var buf = Buffer.alloc(4);

    buf[0] = 0; buf[1] = 0; buf[2] = this.highSurrogate[1]; buf[3] = this.highSurrogate[0];
    this.highSurrogate = null;

    return buf;
};


// -- Decoding

function Utf32BEDecoder(options, codec) {
    this.badChar = Buffer.from(codec.iconv.defaultCharUnicode, 'ucs2');
    this.overflow = null;
}

Utf32BEDecoder.prototype.write = function(src) {
    if (src.length === 0)
        return '';
    else if (this.overflow) {
        src = Buffer.concat([this.overflow, src]);
    }

    var goodLength = src.length - src.length % 4;

    if (src.length !== goodLength) {
        this.overflow = src.slice(goodLength);
        src = src.slice(0, goodLength);
    }
    else
        this.overflow = null;

    var dst = Buffer.alloc(goodLength);
    var offset = 0;

    for (var i = 0; i < goodLength; i += 4) {
        var b3 = src[i];
        var b2 = src[i + 1];
        var b1 = src[i + 2];
        var b0 = src[i + 3];

        if (b3 === 0 && b2 === 0) {
            // Simple 16-bit character
            dst[offset++] = b0; dst[offset++] = b1;
        }
        else {
            var codepoint = b3 * 0x1000000 + b2 * 0x10000 + b1 * 0x100 + b0;

            if (codepoint > 0x10FFFF) {
                // Not a valid Unicode codepoint
                dst[offset++] = this.badChar[0]; dst[offset++] = this.badChar[1];
            }
            else {
                codepoint -= 0x10000;
                var high = 0xD800 | (codepoint >> 10);
                var low = 0xDC00 + (codepoint & 0x3FF);
                dst[offset++] = high & 0xFF; dst[offset++] = high >> 8;
                dst[offset++] = low & 0xFF; dst[offset++] = low >> 8;
            }
        }
    }

    return dst.slice(0, offset).toString('ucs2');
};

Utf32BEDecoder.prototype.end = function() {
    this.overflow = null;
};

// == UTF-32 codec =============================================================
// Decoder chooses automatically from UTF-32LE and UTF-32BE using BOM and space-based heuristic.
// Defaults to UTF-32LE. http://en.wikipedia.org/wiki/UTF-32
// Encoder/decoder default can be changed: iconv.decode(buf, 'utf32', {defaultEncoding: 'utf-32be'});

// Encoder prepends BOM (which can be overridden with (addBOM: false}).

exports.utf32 = Utf32Codec;
exports.ucs4 = Utf32Codec;

function Utf32Codec(options, iconv) {
    this.iconv = iconv;
}

Utf32Codec.prototype.encoder = Utf32Encoder;
Utf32Codec.prototype.decoder = Utf32Decoder;

// -- Encoding

function Utf32Encoder(options, codec) {
    options = options || {};

    if (options.addBOM === undefined)
        options.addBOM = true;

    this.encoder = codec.iconv.getEncoder(options.defaultEncoding || 'utf-32le', options);
}

Utf32Encoder.prototype.write = function(str) {
    return this.encoder.write(str);
};

Utf32Encoder.prototype.end = function() {
    return this.encoder.end();
};


// -- Decoding

function Utf32Decoder(options, codec) {
    this.decoder = null;
    this.initialBytes = [];
    this.initialBytesLen = 0;
    this.options = options || {};
    this.iconv = codec.iconv;
}

Utf32Decoder.prototype.write = function(buf) {
    if (!this.decoder) {
        // Codec is not chosen yet. Accumulate initial bytes.
        this.initialBytes.push(buf);
        this.initialBytesLen += buf.length;

        if (this.initialBytesLen < 32) // We need more bytes to use space heuristic (see below)
            return '';

        // We have enough bytes -> detect endianness.
        var buf2 = Buffer.concat(this.initialBytes),
            encoding = detectEncoding(buf2, this.options.defaultEncoding);
        this.decoder = this.iconv.getDecoder(encoding, this.options);
        this.initialBytes.length = this.initialBytesLen = 0;
    }

    return this.decoder.write(buf);
};


Utf32Decoder.prototype.end = function() {
    if (!this.decoder) {
        var buf = Buffer.concat(this.initialBytes),
            encoding = detectEncoding(buf, this.options.defaultEncoding);
        this.decoder = this.iconv.getDecoder(encoding, this.options);

        var res = this.decoder.write(buf),
            trail = this.decoder.end();

        return trail ? (res + trail) : res;
    }

    return this.decoder.end();
};

function detectEncoding(buf, defaultEncoding) {
    var enc = defaultEncoding || 'utf-32le';

    if (buf.length >= 4) {
        // Check BOM.
        if (buf[0] === 0 && buf[1] === 0 && buf[2] === 0xFE && buf[3] === 0xFF) // UTF-32BE BOM
            enc = 'utf-32be';
        else if (buf[0] === 0xFF && buf[1] === 0xFE && buf[2] === 0 && buf[3] === 0) // UTF-32LE BOM
            enc = 'utf-32le';
        else {
            // No BOM found. Try to deduce encoding from initial content.
            // Using the wrong endian-ism for UTF-32 will very often result in codepoints that are beyond
            // the valid Unicode limit of 0x10FFFF. That will be used as the primary determinant.
            //
            // Further, we can suppose the content is mostly plain ASCII chars (U+00**).
            // So, we count ASCII as if it was LE or BE, and decide from that.
            var invalidLE = 0, invalidBE = 0;
            var asciiCharsLE = 0, asciiCharsBE = 0, // Counts of chars in both positions
                _len = Math.min(buf.length - (buf.length % 4), 128); // Len is always even.

            for (var i = 0; i < _len; i += 4) {
                var b0 = buf[i], b1  = buf[i + 1], b2 = buf[i + 2], b3 = buf[i + 3];

                if (b0 !== 0 || b1 > 0x10) ++invalidBE;
                if (b3 !== 0 || b2 > 0x10) ++invalidLE;

                if (b0 === 0 && b1 === 0 && b2 === 0 && b3 !== 0) asciiCharsBE++;
                if (b0 !== 0 && b1 === 0 && b2 === 0 && b3 === 0) asciiCharsLE++;
            }

            if (invalidBE < invalidLE)
                enc = 'utf-32be';
            else if (invalidLE < invalidBE)
                enc = 'utf-32le';
            if (asciiCharsBE > asciiCharsLE)
                enc = 'utf-32be';
            else if (asciiCharsBE < asciiCharsLE)
                enc = 'utf-32le';
        }
    }

    return enc;
}
