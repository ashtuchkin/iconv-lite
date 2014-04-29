
var iconv = module.exports;

// All codecs and aliases are kept here, keyed by encoding name/alias.
// They are lazy loaded in `iconv.getCodec` from `encodings/index.js`.
iconv.encodings = null;

// Characters emitted in case of error.
iconv.defaultCharUnicode = '�';
iconv.defaultCharSingleByte = '?';

// Public API.
iconv.encode = function encode(str, encoding, options) {
    str = "" + (str || ""); // Ensure string.

    var encoder = iconv.getCodec(encoding).encoder(options);

    var res = encoder.write(str);
    var trail = encoder.end();
    
    return (trail && trail.length > 0) ? Buffer.concat([res, trail]) : res;
}

iconv.decode = function decode(buf, encoding, options) {
    buf = (buf instanceof Buffer) ? buf : new Buffer("" + (buf || ""), "binary"); // Ensure buffer.

    var decoder = iconv.getCodec(encoding).decoder(options);

    var res = decoder.write(buf);
    var trail = decoder.end();

    return (trail && trail.length > 0) ? (res + trail) : res;
}

iconv.encodingExists = function encodingExists(enc) {
    try {
        iconv.getCodec(enc);
        return true;
    } catch (e) {
        return false;
    }
}

// Legacy aliases to convert functions
iconv.toEncoding = iconv.encode;
iconv.fromEncoding = iconv.decode;

// Search for a codec in iconv.encodings. Cache codec data.
iconv._codecDataCache = {};
iconv.getCodec = function getCodec(encoding) {
    if (!iconv.encodings)
        iconv.encodings = require("../encodings"); // Lazy load all encoding definitions.
    
    // Canonicalize encoding name: strip all non-alphanumeric chars and appended year.
    var enc = (''+encoding).toLowerCase().replace(/[^0-9a-z]|:\d{4}$/g, "");

    var codecOptions, saveEnc;
    while (true) {
        var codecData = iconv._codecDataCache[enc];
        if (codecData)
            return codecData;

        var codec = iconv.encodings[enc];

        switch (typeof codec) {
            case "string": // Direct alias to other encoding.
                enc = codec;
                break;

            case "object": // Alias with additional options. Can be layered.
                if (!codecOptions) {
                    codecOptions = codec;
                    saveEnc = enc;
                }
                else {
                    for (var key in codec)
                        codecOptions[key] = codec[key];
                }

                enc = codec.type;
                break;

            case "function": // Codec itself.
                codecOptions.iconv = iconv;
                codecOptions.encodingName = saveEnc;
                codecData = codec(codecOptions);
                iconv._codecDataCache[saveEnc || enc] = codecData; // Save it to be reused later.
                return codecData;

            default:
                throw new Error("Encoding not recognized: '" + encoding + "' (searched as: '"+enc+"')");
        }
    }
}

iconv.encodeStream = iconv.decodeStream = function() { throw new Error("Iconv-lite streams supported only since Node v0.10."); }
iconv.supportsStreams = false;

// Load extensions in Node.
var nodeVer = typeof process !== 'undefined' && process.versions && 
                process.versions.node && process.versions.node.split(".").map(Number);

if (nodeVer) {
    // Load streaming support in Node v0.10+
    if (nodeVer[0] > 0 || nodeVer[1] >= 10) {
        require("./str"+"eams")(iconv); // Hide this module from Browserify by using expression in require().
    }

    // Load Node primitive extensions.
    require("./ext"+"end-node")(iconv);
}

// Re-export Buffer for Browserify.
iconv.Buffer = Buffer;
