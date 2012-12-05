"use strict";

module.exports = {
    _internal: {
        encoder: InternalEncoder,
        decoder: InternalDecoder,
    },

    utf8: "_internal",
    ucs2: "_internal",
    binary: "_internal",
    ascii: "_internal",
    base64: "_internal",
};

function InternalEncoder(options) {
    this.encoding = options.aliases[options.aliases.length-2]; // Previous encoding name.
}

InternalEncoder.prototype.encode = function(str) {
    return new Buffer(str, this.encoding);
}

function InternalDecoder(options) {
    this.encoding = options.aliases[options.aliases.length-2]; // Previous encoding name.
}

InternalDecoder.prototype.decode = function(buf) {
    return buf.toString(this.encoding);
}

