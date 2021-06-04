"use strict";
var Buffer = require("buffer").Buffer;

// Export Node.js internal encodings.

module.exports = {
    // Encodings
    utf8: { type: "_internal", bomAware: true },
    cesu8: { type: "_internal", bomAware: true },
    unicode11utf8: "utf8",

    // NOTE: utf-16le/ucs2 are in utf16.js.

    binary: { type: "_internal" },
    base64: { type: "_internal" },
    hex: { type: "_internal" },

    // Codec.
    _internal: InternalCodec,
};

//------------------------------------------------------------------------------

function InternalCodec(codecOptions, iconv) {
    this.enc = codecOptions.encodingName;
    this.bomAware = codecOptions.bomAware;

    if (this.enc === "base64") {
        this.encoder = InternalEncoderBase64;
    } else if (this.enc === "cesu8") {
        this.enc = "utf8"; // Use utf8 for decoding.
        this.encoder = InternalEncoderCesu8;

        // Add decoder for versions of Node not supporting CESU-8
        if (Buffer.from("eda0bdedb2a9", "hex").toString() !== "💩") {
            this.decoder = InternalDecoderCesu8;
            this.defaultCharUnicode = iconv.defaultCharUnicode;
        }
    }
}

InternalCodec.prototype.encoder = InternalEncoder;
InternalCodec.prototype.decoder = InternalDecoder;

//------------------------------------------------------------------------------

// We use node.js internal decoder. Its signature is the same as ours.
var StringDecoder = require("string_decoder").StringDecoder;

if (!StringDecoder.prototype.end) {
    // Node v0.8 doesn't have this method.
    StringDecoder.prototype.end = function () {};
}

function InternalDecoder(options, codec) {
    this.decoder = new StringDecoder(codec.enc);
}

InternalDecoder.prototype.write = function (buf) {
    if (!Buffer.isBuffer(buf)) {
        buf = Buffer.from(buf);
    }

    return this.decoder.write(buf);
};

InternalDecoder.prototype.end = function () {
    return this.decoder.end();
};

//------------------------------------------------------------------------------
// Encoder is mostly trivial

function InternalEncoder(options, codec) {
    this.enc = codec.enc;
}

InternalEncoder.prototype.write = function (str) {
    return Buffer.from(str, this.enc);
};

InternalEncoder.prototype.end = function () {};

//------------------------------------------------------------------------------
// Except base64 encoder, which must keep its state.

function InternalEncoderBase64() {
    this.prevStr = "";
}

InternalEncoderBase64.prototype.write = function (str) {
    str = this.prevStr + str;
    var completeQuads = str.length - (str.length % 4);
    this.prevStr = str.slice(completeQuads);
    str = str.slice(0, completeQuads);

    return Buffer.from(str, "base64");
};

InternalEncoderBase64.prototype.end = function () {
    return Buffer.from(this.prevStr, "base64");
};

//------------------------------------------------------------------------------
// CESU-8 encoder is also special.

function InternalEncoderCesu8() {}

InternalEncoderCesu8.prototype.write = function (str) {
    const buf = Buffer.alloc(str.length * 3);
    let bufIdx = 0;
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        // Naive implementation, but it works because CESU-8 is especially easy
        // to convert from UTF-16 (which all JS strings are encoded in).
        if (charCode < 0x80) {
            buf[bufIdx++] = charCode;
        } else if (charCode < 0x800) {
            buf[bufIdx++] = 0xc0 + (charCode >>> 6);
            buf[bufIdx++] = 0x80 + (charCode & 0x3f);
        } else {
            // charCode will always be < 0x10000 in javascript.
            buf[bufIdx++] = 0xe0 + (charCode >>> 12);
            buf[bufIdx++] = 0x80 + ((charCode >>> 6) & 0x3f);
            buf[bufIdx++] = 0x80 + (charCode & 0x3f);
        }
    }
    return buf.slice(0, bufIdx);
};

InternalEncoderCesu8.prototype.end = function () {};

//------------------------------------------------------------------------------
// CESU-8 decoder is not implemented in Node v4.0+

function InternalDecoderCesu8(options, codec) {
    this.acc = 0;
    this.contBytes = 0;
    this.accBytes = 0;
    this.defaultCharUnicode = codec.defaultCharUnicode;
}

InternalDecoderCesu8.prototype.write = function (buf) {
    let acc = this.acc,
        contBytes = this.contBytes,
        accBytes = this.accBytes,
        res = "";
    for (let i = 0; i < buf.length; i++) {
        const curByte = buf[i];
        if ((curByte & 0xc0) !== 0x80) {
            // Leading byte
            if (contBytes > 0) {
                // Previous code is invalid
                res += this.defaultCharUnicode;
                contBytes = 0;
            }

            if (curByte < 0x80) {
                // Single-byte code
                res += String.fromCharCode(curByte);
            } else if (curByte < 0xe0) {
                // Two-byte code
                acc = curByte & 0x1f;
                contBytes = 1;
                accBytes = 1;
            } else if (curByte < 0xf0) {
                // Three-byte code
                acc = curByte & 0x0f;
                contBytes = 2;
                accBytes = 1;
            } else {
                // Four or more are not supported for CESU-8.
                res += this.defaultCharUnicode;
            }
        } else {
            // Continuation byte
            if (contBytes > 0) {
                // We're waiting for it.
                acc = (acc << 6) | (curByte & 0x3f);
                contBytes--;
                accBytes++;
                if (contBytes === 0) {
                    // Check for overlong encoding, but support Modified UTF-8 (encoding NULL as C0 80)
                    if (accBytes === 2 && acc < 0x80 && acc > 0) res += this.defaultCharUnicode;
                    else if (accBytes === 3 && acc < 0x800) res += this.defaultCharUnicode;
                    // Actually add character.
                    else res += String.fromCharCode(acc);
                }
            } else {
                // Unexpected continuation byte
                res += this.defaultCharUnicode;
            }
        }
    }
    this.acc = acc;
    this.contBytes = contBytes;
    this.accBytes = accBytes;
    return res;
};

InternalDecoderCesu8.prototype.end = function () {
    let res = "";
    if (this.contBytes > 0) {
        res += this.defaultCharUnicode;
    }
    return res;
};
