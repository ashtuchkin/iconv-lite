"use strict";

var bomHandling = require("./bom-handling"),
    iconv = module.exports;

// All codecs and aliases are kept here, keyed by encoding name/alias.
// They are lazy loaded in `iconv.getCodec` from `encodings/index.js`.
iconv.encodings = null;

// Characters emitted in case of error.
iconv.defaultCharUnicode = "�";
iconv.defaultCharSingleByte = "?";

// Public API.
iconv.encode = function encode(str, encoding, options) {
    if (typeof str !== "string") throw new TypeError("iconv-lite can only encode() strings.");

    var encoder = iconv.getEncoder(encoding, options);

    var res = encoder.write(str);
    var trail = encoder.end();

    return trail && trail.length > 0 ? iconv.backend.concatByteResults([res, trail]) : res;
};

iconv.decode = function decode(buf, encoding, options) {
    if (typeof buf === "string")
        throw new TypeError("iconv-lite can't decode() strings, only Buffer/Uint8Array-s.");

    var decoder = iconv.getDecoder(encoding, options);

    var res = decoder.write(buf);
    var trail = decoder.end();

    return trail ? res + trail : res;
};

iconv.encodingExists = function encodingExists(enc) {
    try {
        iconv.getCodec(enc);
        return true;
    } catch (e) {
        return false;
    }
};

// Legacy aliases to convert functions
iconv.toEncoding = iconv.encode;
iconv.fromEncoding = iconv.decode;

// Search for a codec in iconv.encodings. Cache codec data in iconv._codecDataCache.
iconv._codecDataCache = {};
iconv.getCodec = function getCodec(encoding) {
    if (!iconv.encodings) {
        iconv.encodings = require("../encodings"); // Lazy load all encoding definitions.
    }

    // Canonicalize encoding name: strip all non-alphanumeric chars and appended year.
    var enc = iconv._canonicalizeEncoding(encoding);

    // Traverse iconv.encodings to find actual codec.
    var codecOptions = {};
    for (;;) {
        var codec = iconv._codecDataCache[enc];
        if (codec) return codec;

        var codecDef = iconv.encodings[enc];

        switch (typeof codecDef) {
            case "string": // Direct alias to other encoding.
                enc = codecDef;
                break;

            case "object": // Alias with options. Can be layered.
                for (var key in codecDef) {
                    codecOptions[key] = codecDef[key];
                }

                if (!codecOptions.encodingName) {
                    codecOptions.encodingName = enc;
                }

                enc = codecDef.type;
                break;

            case "function": // Codec itself.
                if (!codecOptions.encodingName) {
                    codecOptions.encodingName = enc;
                }

                // The codec function must load all tables and return object with .encoder and .decoder methods.
                // It'll be called only once (for each different options object).
                codec = new codecDef(codecOptions, iconv);

                iconv._codecDataCache[codecOptions.encodingName] = codec; // Save it to be reused later.
                return codec;

            default:
                throw new Error(`Encoding not recognized: '${encoding}' (searched as: '${enc}')`);
        }
    }
};

iconv._canonicalizeEncoding = function (encoding) {
    // Canonicalize encoding name: strip all non-alphanumeric chars and appended year.
    return ("" + encoding).toLowerCase().replace(/:\d{4}$|[^0-9a-z]/g, "");
};

iconv.getEncoder = function getEncoder(encoding, options) {
    const codec = iconv.getCodec(encoding);

    let encoder = codec.createEncoder
        ? codec.createEncoder(options, iconv)
        : new codec.encoder(options, codec, iconv.backend);

    if (codec.bomAware && options && options.addBOM)
        encoder = new bomHandling.PrependBOM(encoder, options);

    return encoder;
};

iconv.getDecoder = function getDecoder(encoding, options) {
    const codec = iconv.getCodec(encoding);

    let decoder = codec.createDecoder
        ? codec.createDecoder(options, iconv)
        : new codec.decoder(options, codec, iconv.backend);

    if (codec.bomAware && !(options && options.stripBOM === false))
        decoder = new bomHandling.StripBOM(decoder, options);

    return decoder;
};

iconv.byteLength = function byteLength(str, encoding, options) {
    return iconv.getEncoder(encoding, options).byteLength(str);
};

// Streaming API
// NOTE: Streaming API naturally depends on 'stream' module from Node.js. Unfortunately in browser environments this module can add
// up to 100Kb to the output bundle. To avoid unnecessary code bloat, we don't enable Streaming API in browser by default.
// If you would like to enable it explicitly, please add the following code to your app:
// > iconv.enableStreamingAPI(require('stream'));
iconv.enableStreamingAPI = function enableStreamingAPI(stream_module) {
    if (iconv.supportsStreams) return;

    // Dependency-inject stream module to create IconvLite stream classes.
    var streams = require("./streams")(stream_module);

    // Not public API yet, but expose the stream classes.
    iconv.IconvLiteEncoderStream = streams.IconvLiteEncoderStream;
    iconv.IconvLiteDecoderStream = streams.IconvLiteDecoderStream;

    // Streaming API.
    iconv.encodeStream = function encodeStream(encoding, options) {
        const encoder = iconv.getEncoder(encoding, options);
        return new iconv.IconvLiteEncoderStream(encoder, options, iconv);
    };

    iconv.decodeStream = function decodeStream(encoding, options) {
        const decoder = iconv.getDecoder(encoding, options);
        return new iconv.IconvLiteDecoderStream(decoder, options, iconv);
    };

    iconv.supportsStreams = true;
};

// Enable Streaming API automatically if 'stream' module is available and non-empty (the majority of environments).
var stream_module;
try {
    stream_module = require("stream");
} catch (e) {
    // Skip
}

if (stream_module && stream_module.Transform) {
    iconv.enableStreamingAPI(stream_module);
} else {
    // In rare cases where 'stream' module is not available by default, throw a helpful exception.
    iconv.encodeStream = iconv.decodeStream = function () {
        throw new Error(
            "iconv-lite Streaming API is not enabled. Use iconv.enableStreamingAPI(require('stream')); to enable it."
        );
    };
}

// Add a helpful message if the backend is not set.
Object.defineProperty(iconv, "backend", {
    configurable: true,
    get() {
        throw new Error("iconv-lite backend is not set. Please use iconv.setBackend().");
    },
});

iconv.setBackend = function setBackend(backend) {
    delete iconv.backend;
    iconv.backend = backend;
    iconv._codecDataCache = {};
};

// eslint-disable-next-line no-constant-condition
if ("Ā" != "\u0100") {
    // eslint-disable-next-line no-console
    console.error(
        "iconv-lite warning: js files use non-utf8 encoding. See https://github.com/ashtuchkin/iconv-lite/wiki/Javascript-source-file-encodings for more info."
    );
}
