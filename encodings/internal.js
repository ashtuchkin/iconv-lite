
// Export Node.js internal encodings.

module.exports = {
    // Encodings
    utf8:   { type: "_internal", enc: "utf8", bomAware: true},
    cesu8:  "utf8",
    unicode11utf8: "utf8",

    utf16le:{ type: "_internal", enc: "ucs2", bomAware: true},
    ucs2:   "utf16le",

    binary: { type: "_internal", enc: "binary" },
    base64: { type: "_internal", enc: "base64" },
    hex:    { type: "_internal", enc: "hex" },

    // Codec.
    _internal: function(codecOptions) {
        if (!codecOptions || !codecOptions.enc)
            throw new Error("Internal codec is called without encoding type.")

        return {
            encoder: codecOptions.enc == "base64" ? encoderBase64 : encoderInternal,
            decoder: decoderInternal,

            enc: codecOptions.enc,
            bomAware: codecOptions.bomAware,
        };
    },
};

// We use node.js internal decoder. It's signature is the same as ours.
var StringDecoder = require('string_decoder').StringDecoder;

if (!StringDecoder.prototype.end) // Node v0.8 doesn't have this method.
    StringDecoder.prototype.end = function() {};

function decoderInternal() {
    return new StringDecoder(this.enc);
}

// Encoder is mostly trivial

function encoderInternal() {
    return {
        write: encodeInternal,
        end: function() {},
        
        enc: this.enc,
    }
}

function encodeInternal(str) {
    return new Buffer(str, this.enc);
}


// Except base64 encoder, which must keep its state.

function encoderBase64() {
    return {
        write: encodeBase64Write,
        end: encodeBase64End,

        prevStr: '',
    };
}

function encodeBase64Write(str) {
    str = this.prevStr + str;
    var completeQuads = str.length - (str.length % 4);
    this.prevStr = str.slice(completeQuads);
    str = str.slice(0, completeQuads);

    return new Buffer(str, "base64");
}

function encodeBase64End() {
    return new Buffer(this.prevStr, "base64");
}

