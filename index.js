// Module exports
var iconv = module.exports = {
    toEncoding: function(str, encoding) {
        return iconv.getCodec(encoding).toEncoding(str);
    },
    fromEncoding: function(buf, encoding) {
        return iconv.getCodec(encoding).fromEncoding(buf);
    },
    
    defaultCharUnicode: '�',
    defaultCharSingleByte: '?',

    encodingsLoaded: false,
    
    // Get correct codec for given encoding.
    getCodec: function(encoding) {
        if (!iconv.encodingsLoaded) {
            applyEncodings(require('./encodings/singlebyte'));
            applyEncodings(require('./encodings/gbk'));
            applyEncodings(require('./encodings/big5'));
            iconv.encodingsLoaded = true;
        }
        var enc = encoding || "utf8";
        var codecOptions = undefined;
        while (1) {
            if (getType(enc) === "String")
                enc = enc.replace(/[- ]/g, "").toLowerCase();
            var codec = iconv.encodings[enc];
            var type = getType(codec);
            if (type === "String") {
                // Link to other encoding.
                codecOptions = {originalEncoding: enc};
                enc = codec;
            }
            else if (type === "Object" && codec.type != undefined) {
                // Options for other encoding.
                codecOptions = codec;
                enc = codec.type;
            } 
            else if (type === "Function")
                // Codec itself.
                return codec(codecOptions);
            else
                throw new Error("Encoding not recognized: '" + encoding + "' (searched as: '"+enc+"')");
        }
    },
    
    // Define basic encodings
    encodings: {
        internal: function(options) {
            return {
                toEncoding: toInternalEncoding,
                fromEncoding: fromInternalEncoding,
                options: options
            };
        },
        utf8: "internal",
        ucs2: "internal",
        binary: "internal",
        ascii: "internal",
        base64: "internal",
        
        // Codepage single-byte encodings.
        singlebyte: function(options) {
            // Prepare chars if needed
            if (!options.charsBuf) {
                if (!options.chars || (options.chars.length !== 128 && options.chars.length !== 256))
                    throw new Error("Encoding '"+options.type+"' has incorrect 'chars' (must be of len 128 or 256)");
                
                if (options.chars.length === 128)
                    options.chars = asciiString + options.chars;

                options.charsBuf = new Buffer(options.chars, 'ucs2');
            }
            
            if (!options.revCharsBuf) {
                options.revCharsBuf = new Buffer(65536);
                var defChar = iconv.defaultCharSingleByte.charCodeAt(0);
                for (var i = 0; i < options.revCharsBuf.length; i++)
                    options.revCharsBuf[i] = defChar;
                for (var i = 0; i < options.chars.length; i++)
                    options.revCharsBuf[options.chars.charCodeAt(i)] = i;
            }

            return {
                toEncoding: toSingleByteEncoding,
                fromEncoding: fromSingleByteEncoding,
                options: options,
            };
        },

        // Codepage double-byte encodings.
        table: function(options) {
            if (!options.table) {
                throw new Error("Encoding '" + options.type + "' has incorect 'table' option");
            }
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
            
            return {
                toEncoding: toTableEncoding,
                fromEncoding: fromTableEncoding,
                options: options,
            };
        }
    }
};

function toInternalEncoding(str) {
    return new Buffer(ensureString(str), this.options.originalEncoding);
}

function fromInternalEncoding(buf) {
    return ensureBuffer(buf).toString(this.options.originalEncoding);
}

function toTableEncoding(str) {
    str = ensureString(str);
    var strLen = str.length;
    var revCharsTable = this.options.revCharsTable;
    var newBuf = new Buffer(strLen*2), gbkcode, unicode,
        defaultChar = revCharsTable[iconv.defaultCharUnicode.charCodeAt(0)];

    for (var i = 0, j = 0; i < strLen; i++) {
        unicode = str.charCodeAt(i);
        if (unicode >> 7) {
            gbkcode = revCharsTable[unicode] || defaultChar;
            newBuf[j++] = gbkcode >> 8; //high byte;
            newBuf[j++] = gbkcode & 0xFF; //low byte
        } else {//ascii
            newBuf[j++] = unicode;
        }
    }
    return newBuf.slice(0, j);
}

function fromTableEncoding(buf) {
    buf = ensureBuffer(buf);
    var bufLen = buf.length;
    var table = this.options.table;
    var newBuf = new Buffer(bufLen*2), unicode, gbkcode,
        defaultChar = iconv.defaultCharUnicode.charCodeAt(0);

    for (var i = 0, j = 0; i < bufLen; i++, j+=2) {
        gbkcode = buf[i];
        if (gbkcode & 0x80) {
            gbkcode = (gbkcode << 8) + buf[++i];
            unicode = table[gbkcode] || defaultChar;
        } else {
            unicode = gbkcode;
        }
        newBuf[j] = unicode & 0xFF; //low byte
        newBuf[j+1] = unicode >> 8; //high byte
    }
    return newBuf.slice(0, j).toString('ucs2');
}

function toSingleByteEncoding(str) {
    str = ensureString(str);
    
    var buf = new Buffer(str.length);
    var revCharsBuf = this.options.revCharsBuf;
    for (var i = 0; i < str.length; i++)
        buf[i] = revCharsBuf[str.charCodeAt(i)];
    
    return buf;
}

function fromSingleByteEncoding(buf) {
    buf = ensureBuffer(buf);
    
    // Strings are immutable in JS -> we use ucs2 buffer to speed up computations.
    var charsBuf = this.options.charsBuf;
    var newBuf = new Buffer(buf.length*2);
    var idx1 = 0, idx2 = 0;
    for (var i = 0, _len = buf.length; i < _len; i++) {
        idx1 = buf[i]*2; idx2 = i*2;
        newBuf[idx2] = charsBuf[idx1];
        newBuf[idx2+1] = charsBuf[idx1+1];
    }
    return newBuf.toString('ucs2');
}

// Add aliases to convert functions
iconv.encode = iconv.toEncoding;
iconv.decode = iconv.fromEncoding;

// Load other encodings manually from files in /encodings dir.
function applyEncodings(encodings) {
    for (var key in encodings)
        iconv.encodings[key] = encodings[key]
}



// Utilities
var asciiString = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\x0c\r\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f'+
              ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7f';

var ensureBuffer = function(buf) {
    buf = buf || new Buffer(0);
    return (buf instanceof Buffer) ? buf : new Buffer(""+buf, "binary");
}

var ensureString = function(str) {
    str = str || "";
    return (str instanceof Buffer) ? str.toString('utf8') : (""+str);
}

var getType = function(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1);
}

var stream = require('stream');
if ('Transform' in stream) {
    var Transform = stream.Transform;
    var detectIncompleteChar = {'utf8': (new(require('string_decoder').StringDecoder)()).detectIncompleteChar};
    /** StreamEncoder constructs stream.Transform instance
     *  which receives input {String} chunk and sends output {Buffer} with specified encoding
     * @constructor StreamEncoder
     * @param {String} [encoding='utf8'] specifies encoding
     */
    var StreamEncoder = iconv.StreamEncoder = function (encoding) {
        Transform.call(this, {decodeStrings: false});
        this.enc = encoding || 'utf8';
    };
    StreamEncoder.prototype = Object.create(Transform.prototype, {
        constructor: {value: StreamEncoder}
    });
    StreamEncoder.prototype._transform = function(chunk, enc, done) {
        this.push(iconv.toEncoding(chunk, this.enc));
        done();
    };
    /** StreamDecoder constructs stream.Transform instance
     *  which receives input chunk {Buffer} with specified encoding and sends output utf8 {String}
     * @constructor StreamEncoder
     * @param {String} [encoding='utf8'] specifies encoding
     */
    var StreamDecoder = iconv.StreamDecoder = function (encoding) {
        Transform.call(this, {encoding: 'utf8'});
        this.enc = encoding || 'utf8';
        /** @private {Buffer} tail contains octets of incompleted chars*/
        this.tail = new Buffer(0);
    };
    StreamDecoder.prototype = Object.create(Transform.prototype, {
        constructor: {value: StreamDecoder}
    });
    StreamDecoder.prototype._transform = function(chunk, enc, done) {
        var buf = Buffer.concat([this.tail, chunk]);
        var incompleted = this.enc in detectIncompleteChar ? detectIncompleteChar[this.enc](buf) : 0;
        if (incompleted > 0) {
            this.tail = buf.slice(buf.length - incompleted);
            buf = buf.slice(0, buf.length - incompleted);
        }
        this.push(iconv.fromEncoding(buf, this.enc));
        done();
    };
}
