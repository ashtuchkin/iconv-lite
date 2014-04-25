
var IconvLiteEncoderStream = false,
    IconvLiteDecoderStream = false;

var iconv = module.exports = {
    // All codecs and aliases are kept here, keyed by encoding name.
    // They are lazy loaded in `getCodec` by `/encodings/index.js` to make initial module loading fast.
    encodings: null,

    codecData: {},

    // Characters emitted in case of error.
    defaultCharUnicode: '�',
    defaultCharSingleByte: '?',

    // Public API
    encode: function(str, encoding, options) {
        str = ensureString(str);
        var encoder = iconv.getCodec(encoding).encoder(options);
        var front = encoder.write(str);
        var end = encoder.end();
        if (end)
            return Buffer.concat([front, end]);
        else
            return front;
    },
    decode: function(buf, encoding, options) {
        buf = ensureBuffer(buf);
        var decoder = iconv.getCodec(encoding).decoder(options);
        var front = decoder.write(buf);
        var end = decoder.end();
        if (end)
            return front + end;
        else
            return front;
    },

    encodeStream: function(encoding, options) {
        if (!IconvLiteEncoderStream)
            throw new Error("Iconv-lite streams supported only since Node v0.10.");

        return new IconvLiteEncoderStream(iconv.getCodec(encoding).encoder(options), options);
    },
    decodeStream: function(encoding, options) {
        if (!IconvLiteDecoderStream)
            throw new Error("Iconv-lite streams supported only since Node v0.10.");

        return new IconvLiteDecoderStream(iconv.getCodec(encoding).decoder(options), options);
    },

    encodingExists: function(enc) {
        try {
            iconv.getCodec(enc);
            return true;
        } catch (e) {
            return false;
        }
    },
    supportsStreams: function() {
        return !!IconvLiteEncoderStream;
    },

    // Search for a codec.
    getCodec: function(encoding) {
        if (!iconv.encodings)
            iconv.encodings = require("./encodings"); // Lazy load all encoding definitions.
        
        // Canonicalize encoding name: strip all non-alphanumeric chars and appended year.
        var enc = (''+encoding).toLowerCase().replace(/[^0-9a-z]|:\d{4}$/g, "");

        var codecOptions, saveEnc;
        while (1) {
            var codecData = iconv.codecData[enc];
            if (codecData)
                return codecData;

            var codec = iconv.encodings[enc];

            switch (getType(codec)) {
                case "String": // Direct alias to other encoding.
                    enc = codec;
                    break;

                case "Object": // Alias with additional options. Can be layered.
                    if (!codecOptions) {
                        codecOptions = codec;
                        saveEnc = enc;
                    }
                    else
                        for (var key in codec)
                            codecOptions[key] = codec[key];

                    enc = codec.type;
                    break;

                case "Function": // Codec itself.
                    codecOptions.iconv = iconv;
                    codecData = codec(codecOptions);
                    iconv.codecData[saveEnc || enc] = codecData; // Save it to be reused later.
                    return codecData;

                default:
                    throw new Error("Encoding not recognized: '" + encoding + "' (searched as: '"+enc+"')");
            }
        }
    },

};

// Legacy aliases to convert functions
iconv.toEncoding = iconv.encode;
iconv.fromEncoding = iconv.decode;


// Utilities
function getType(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1);
}

function ensureBuffer(buf) {
    buf = buf || new Buffer(0);
    return (buf instanceof Buffer) ? buf : new Buffer(""+buf, "binary");
}

function ensureString(str) {
    str = str || "";
    return (str instanceof Buffer) ? str.toString('utf8') : (""+str);
}

// Streaming support for Node v0.10+
var nodeVer = process.versions.node.split(".").map(Number);
if (nodeVer[0] > 0 || nodeVer[1] >= 10) {
    var Transform = require("stream").Transform;

    // == Encoder stream =======================================================
    IconvLiteEncoderStream = function IconvLiteEncoderStream(conv, options) {
        this.conv = conv;
        options = options || {};
        options.decodeStrings = false; // We accept only strings, so we don't need to decode them.
        Transform.call(this, options);
    }

    IconvLiteEncoderStream.prototype = Object.create(Transform.prototype, {
        constructor: { value: IconvLiteEncoderStream }
    });

    IconvLiteEncoderStream.prototype._transform = function(chunk, encoding, done) {
        if (typeof chunk != 'string')
            return done(new Error("Iconv encoding stream needs strings as its input."));
        try {
            var res = this.conv.write(chunk);
            if (res && res.length) this.push(res);
            done();
        }
        catch (e) {
            done(e);
        }
    }

    IconvLiteEncoderStream.prototype._flush = function(done) {
        try {
            var res = this.conv.end();
            if (res && res.length) this.push(res);
            done();
        }
        catch (e) {
            done(e);
        }
    }

    IconvLiteEncoderStream.prototype.collect = function(cb) {
        var chunks = [];
        this.on('error', cb);
        this.on('data', function(chunk) { chunks.push(chunk); });
        this.on('end', function() {
            cb(null, Buffer.concat(chunks));
        });
        return this;
    }


    // == Decoder stream =======================================================
    IconvLiteDecoderStream = function IconvLiteDecoderStream(conv, options) {
        this.conv = conv;
        options = options || {};
        options.encoding = this.encoding = 'utf8'; // We output strings.
        Transform.call(this, options);
    }

    IconvLiteDecoderStream.prototype = Object.create(Transform.prototype, {
        constructor: { value: IconvLiteDecoderStream }
    });

    IconvLiteDecoderStream.prototype._transform = function(chunk, encoding, done) {
        if (!Buffer.isBuffer(chunk))
            return done(new Error("Iconv decoding stream needs buffers as its input."));
        try {
            var res = this.conv.write(chunk);
            if (res && res.length) this.push(res, this.encoding);
            done();
        }
        catch (e) {
            done(e);
        }
    }

    IconvLiteDecoderStream.prototype._flush = function(done) {
        try {
            var res = this.conv.end();
            if (res && res.length) this.push(res, this.encoding);                
            done();
        }
        catch (e) {
            done(e);
        }
    }

    IconvLiteDecoderStream.prototype.collect = function(cb) {
        var res = '';
        this.on('error', cb);
        this.on('data', function(chunk) { res += chunk; });
        this.on('end', function() {
            cb(null, res);
        });
        return this;
    }

    // == Sugar for Readable ===================================================
    var Readable = require('stream').Readable;

    var oldSetEncoding = Readable.prototype.setEncoding;
    Readable.prototype.setEncoding = function setEncoding(enc, options) {
        try {
            oldSetEncoding.call(this, enc); // Try to use original function when possible.
            return;
        }
        catch (e) {}

        // Try to use our own decoder, it has the same interface.
        this._readableState.decoder = iconv.getCodec(enc).decoder(options);
        this._readableState.encoding = enc;
    }

    Readable.prototype.collect = IconvLiteDecoderStream.prototype.collect;

}

