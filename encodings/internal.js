
// Export Node.js internal encodings.

module.exports = {
    // Encodings
    utf8:   { type: "_internal", enc: "utf8" },
    cesu8:  { type: "_internal", enc: "utf8" },
    ucs2:   { type: "_internal", enc: "ucs2" },
    utf16le:{ type: "_internal", enc: "ucs2" },
    binary: { type: "_internal", enc: "binary" },
    base64: { type: "_internal", enc: "base64" },

    // Codec.
    _internal: function(options) {
        if (!options || !options.enc)
            throw new Error("Internal codec is called without encoding type.")

        return {
            encode: encodeInternal,
            decode: decodeInternal,

            encoder: encoderInternal,
            decoder: decoderInternal,

            enc: options.enc,
        };
    },
};


function encodeInternal(str) {
    return new Buffer(str, this.enc);
}

function decodeInternal(buf) {
    return buf.toString(this.enc);
}


var StringDecoder = require('string_decoder').StringDecoder;

function decoderInternal() {
    return new StringDecoder(this.enc);
}

function encoderInternal() {
    return {
        write: encodeInternal.bind(this),
    }
}
