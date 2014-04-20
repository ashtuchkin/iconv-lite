
var iconv = module.exports = {
    // All codecs and aliases are kept here, keyed by encoding name.
    // They are lazy loaded in `getCodec` by `/encodings/index.js` to make initial module loading fast.
    encodings: null,

    codecData: {},

    // Characters emitted in case of error.
    defaultCharUnicode: '�',
    defaultCharSingleByte: '?',

    // Public API
    encode: function(str, encoding) {
        str = iconv.ensureString(str);
        return iconv.getCodec(encoding).encode(str);
    },
    decode: function(buf, encoding) {
        buf = iconv.ensureBuffer(buf);
        return iconv.getCodec(encoding).decode(buf);
    },
    encodingExists: function(enc) {
        try {
            iconv.getCodec(enc);
            return true;
        } catch (e) {
            return false;
        }
    },

    // Search for a codec.
    getCodec: function(encoding) {
        if (!iconv.encodings)
            iconv.encodings = require("./encodings"); // Lazy load all encoding definitions.
        
        var enc = encoding;
        if (iconv.getType(enc) === "String")
            enc = enc.replace(/[-_ ]|:\d{4}$/g, "").toLowerCase(); // Strip all unneeded symbols

        var codecOptions, saveEnc;
        while (1) {
            var codecData = iconv.codecData[enc];
            if (codecData)
                return codecData;

            var codec = iconv.encodings[enc];

            switch (iconv.getType(codec)) {
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
                    codecData = codec(codecOptions, iconv);
                    iconv.codecData[saveEnc || enc] = codecData; // Save it to be reused later.
                    return codecData;

                default:
                    throw new Error("Encoding not recognized: '" + encoding + "' (searched as: '"+enc+"')");
            }
        }
    },

    // Utilities
    getType: function(obj) {
        return Object.prototype.toString.call(obj).slice(8, -1);
    },

    ensureBuffer: function(buf) {
        buf = buf || new Buffer(0);
        return (buf instanceof Buffer) ? buf : new Buffer(""+buf, "binary");
    },

    ensureString: function(str) {
        str = str || "";
        return (str instanceof Buffer) ? str.toString('utf8') : (""+str);
    },
};

// Legacy aliases to convert functions
iconv.toEncoding = iconv.encode;
iconv.fromEncoding = iconv.decode;



