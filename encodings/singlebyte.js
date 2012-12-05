"use strict";

module.exports = require('./singlebyte-index');

// Codepage single-byte encodings.
module.exports._singlebyte = {
    encoder: SingleByteEncoder,
    decoder: SingleByteDecoder,
};

// Prepare chars if needed
function prepareCharsBuf(options) {
    if (!options.charsBuf) {
        if (!options.chars || (options.chars.length !== 128 && options.chars.length !== 256))
            throw new Error("Encoding '"+options.aliases[options.aliases.length-2]+
                "' has incorrect 'chars' (must be of len 128 or 256)");
        
        if (options.chars.length === 128) {
            var asciiString = ""
            for (var i = 0; i < 0x80; i++)
                asciiString += String.fromCharCode(i);
            options.chars = asciiString + options.chars;
        }

        options.charsBuf = new Buffer(options.chars, 'ucs2');
    }
}


function SingleByteEncoder(options) {
    prepareCharsBuf(options);

    if (!options.revCharsBuf) {
        options.revCharsBuf = new Buffer(65536);
        var defChar = options.iconv.defaultCharSingleByte.charCodeAt(0);
        for (var i = 0; i < options.revCharsBuf.length; i++)
            options.revCharsBuf[i] = defChar;
        for (var i = 0; i < options.chars.length; i++)
            options.revCharsBuf[options.chars.charCodeAt(i)] = i;
    }

    this.revCharsBuf = options.revCharsBuf;
}

SingleByteEncoder.prototype.encode = function(str) {
    var buf = new Buffer(str.length);
    for (var i = 0; i < str.length; i++)
        buf[i] = this.revCharsBuf[str.charCodeAt(i)];
    
    return buf;
}



function SingleByteDecoder(options) {
    prepareCharsBuf(options);
    this.charsBuf = options.charsBuf;
}


SingleByteDecoder.prototype.decode = function(buf) {
    // Strings are immutable in JS -> we use ucs2 buffer to speed up computations.
    var charsBuf = this.charsBuf;
    var newBuf = new Buffer(buf.length*2);
    var idx1 = 0, idx2 = 0;
    for (var i = 0, _len = buf.length; i < _len; i++) {
        idx1 = buf[i]*2; idx2 = i*2;
        newBuf[idx2] = charsBuf[idx1];
        newBuf[idx2+1] = charsBuf[idx1+1];
    }
    return newBuf.toString('ucs2');
}
