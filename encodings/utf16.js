"use strict"

// == UTF16-BE codec. ==========================================================

exports.utf16be = function() {
    return {
        encoder: function() { return new Utf16beEncoder() },
        decoder: function() { return new Utf16beDecoder() },

        bomAware: true,
    };
};


// -- Encoding

function Utf16beEncoder() {
}

Utf16beEncoder.prototype.write = function(str) {
    var buf = new Buffer(str, 'ucs2');
    for (var i = 0; i < buf.length; i += 2) {
        var tmp = buf[i]; buf[i] = buf[i+1]; buf[i+1] = tmp;
    }
    return buf;
}

Utf16beEncoder.prototype.end = function() {
}


// -- Decoding

function Utf16beDecoder() {
    this.overflowByte = -1;
}

Utf16beDecoder.prototype.write = function(buf) {
    if (buf.length == 0)
        return '';

    var buf2 = new Buffer(buf.length + 1),
        i = 0, j = 0;

    if (this.overflowByte !== -1) {
        buf2[0] = buf[0];
        buf2[1] = this.overflowByte;
        i = 1; j = 2;
    }

    for (; i < buf.length-1; i += 2, j+= 2) {
        buf2[j] = buf[i+1];
        buf2[j+1] = buf[i];
    }

    this.overflowByte = (i == buf.length-1) ? buf[buf.length-1] : -1;

    return buf2.slice(0, j).toString('ucs2');
}

Utf16beDecoder.prototype.end = function() {
}


// == UTF-16 codec =============================================================
// Decoder chooses automatically from UTF-16LE and UTF-16BE using BOM and space-based heuristic.
// Defaults to UTF-16BE, according to RFC 2781, although it is against some industry practices, see
// http://en.wikipedia.org/wiki/UTF-16 and http://encoding.spec.whatwg.org/#utf-16le
// Decoder default can be changed: iconv.decode(buf, 'utf16', {default: 'utf-16le'});

// Encoder by default uses UTF-16BE and prepends BOM.
// Endianness can be changed: iconv.encode(str, 'utf16', {use: 'utf-16le'});
// BOM can be skipped: iconv.encode(str, 'utf16', {addBOM: false});

exports.utf16 = function(codecOptions, iconv) {
    return {
        encoder: utf16Encoder,
        decoder: function(options) { return new Utf16Decoder(options, this.iconv) },

        iconv: iconv,
        // bomAware-ness is handled inside encoder/decoder functions
    };
};

// -- Encoding

function utf16Encoder(options) {
    options = options || {};
    if (options.addBOM === undefined)
        options.addBOM = true;
    return this.iconv.getEncoder(options.use || 'utf-16be', options);
}

// -- Decoding

function Utf16Decoder(options, iconv) {
    this.decoder = null;
    this.initialBytes = [];
    this.initialBytesLen = 0;

    this.options = options || {};
    this.iconv = iconv;
}

Utf16Decoder.prototype.write = function(buf) {
    if (!this.decoder) {
        // Codec is not chosen yet. Accumulate initial bytes.
        this.initialBytes.push(buf);
        this.initialBytesLen += buf.length;
        
        if (this.initialBytesLen < 16) // We need more bytes to use space heuristic (see below)
            return '';

        // We have enough bytes -> detect endianness.
        var buf = Buffer.concat(this.initialBytes);
        this.initialBytes.length = this.initialBytesLen = 0;

        this.decoder = this.detectDecoder(buf);
    }

    return this.decoder.write(buf);
}

Utf16Decoder.prototype.end = function() {
    if (!this.decoder) {
        var buf = Buffer.concat(this.initialBytes);
        this.decoder = this.detectDecoder(buf);

        var res = this.decoder.write(buf),
            trail = this.decoder.end();

        return trail ? (res + trail) : res;
    }
    return this.decoder.end();
}

Utf16Decoder.prototype.detectDecoder = function(buf) {
    // Default encoding.
    var enc = this.options.default || 'utf-16be';

    if (buf.length >= 2) {
        // Check BOM.
        if (buf[0] == 0xFE && buf[1] == 0xFF) // UTF-16BE BOM
            enc = 'utf-16be';
        else if (buf[0] == 0xFF && buf[1] == 0xFE) // UTF-16LE BOM
            enc = 'utf-16le';
        else {
            // No BOM found. Try to deduce encoding from initial content.
            // Most of the time, the content has spaces (U+0020), but the opposite (U+2000) is very uncommon.
            // So, we count spaces as if it was LE or BE, and decide from that.
            var spacesLE = 0, spacesBE = 0, // Counts of space chars in both positions
                _len = Math.min(buf.length - (buf.length % 2), 64); // Len is always even.

            for (var i = 0; i < _len; i += 2) {
                if (buf[i] == 0x00 && buf[i+1] == 0x20) spacesBE++;
                if (buf[i] == 0x20 && buf[i+1] == 0x00) spacesLE++;
            }

            if (spacesBE > 0 && spacesLE == 0)
                enc = 'utf-16be';
            else if (spacesBE == 0 && spacesLE > 0)
                enc = 'utf-16le';
        }
    }

    return this.iconv.getDecoder(enc, this.options);
}


