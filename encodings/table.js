"use strict";

module.exports = {
    // Double-byte encodings.
    _table: {
        encoder: DoubleByteEncoder,
        decoder: DoubleByteDecoder,
    },
};


function DoubleByteEncoder(options) {
    if (!options.table)
        throw new Error("Encoding '" + options.aliases[options.aliases.length-2] + 
            "' has incorect 'table' option");
    
    if (!options.revCharsTable) {
        var revCharsTable = options.revCharsTable = {};
        for (var i = 0; i <= 0xFFFF; i++) {
            revCharsTable[i] = 0;
        }

        var table = options.table;
        for (var key in table) {
            revCharsTable[table[key]] = +key;
        }
    }

    this.revCharsTable = options.revCharsTable;
    this.defaultChar = options.revCharsTable[options.iconv.defaultCharUnicode.charCodeAt(0)];
}

DoubleByteEncoder.prototype.encode = function(str) {
    var strLen = str.length;
    var newBuf = new Buffer(strLen*2), gbkcode, unicode;

    for (var i = 0, j = 0; i < strLen; i++) {
        unicode = str.charCodeAt(i);
        if (unicode >> 7) {
            gbkcode = this.revCharsTable[unicode] || this.defaultChar;
            newBuf[j++] = gbkcode >> 8; //high byte;
            newBuf[j++] = gbkcode & 0xFF; //low byte
        } else {//ascii
            newBuf[j++] = unicode;
        }
    }
    return newBuf.slice(0, j);
}

function DoubleByteDecoder(options) {
    if (!options.table)
        throw new Error("Encoding '" + options.aliases[options.aliases.length-2] + 
            "' has incorect 'table' option");

    this.table = options.table;
    this.defaultChar = options.iconv.defaultCharUnicode.charCodeAt(0);
}

DoubleByteDecoder.prototype.decode = function(buf) {
    var bufLen = buf.length;
    var newBuf = new Buffer(bufLen*2), unicode, gbkcode;

    for (var i = 0, j = 0; i < bufLen; i++, j+=2) {
        gbkcode = buf[i];
        if (gbkcode & 0x80) {
            gbkcode = (gbkcode << 8) + buf[++i];
            unicode = this.table[gbkcode] || this.defaultChar;
        } else {
            unicode = gbkcode;
        }
        newBuf[j] = unicode & 0xFF; //low byte
        newBuf[j+1] = unicode >> 8; //high byte
    }
    return newBuf.slice(0, j).toString('ucs2');
}


