"use strict";

var Buffer = require("safer-buffer").Buffer;

var bomHandling = require("./bom-handling"),
    iconv = module.exports;

// All codec definitions and aliases are kept here, keyed by encoding name/alias.
// They are lazy loaded in `iconv.getCodec` from `encodings/index.js`.
// `iconv.preloadCodecsAndData` will preload everything into memory to avoid lazy loading.
iconv.encodings = null;

// Characters emitted in case of error.
iconv.defaultCharUnicode = '�';
iconv.defaultCharSingleByte = '?';

// Public API.
iconv.encode = function encode(str, encoding, options) {
    str = "" + (str || ""); // Ensure string.

    var encoder = iconv.getEncoder(encoding, options);

    var res = encoder.write(str);
    var trail = encoder.end();
    
    return (trail && trail.length > 0) ? Buffer.concat([res, trail]) : res;
}

iconv.decode = function decode(buf, encoding, options) {
    if (typeof buf === 'string') {
        if (!iconv.skipDecodeWarning) {
            console.error('Iconv-lite warning: decode()-ing strings is deprecated. Refer to https://github.com/ashtuchkin/iconv-lite/wiki/Use-Buffers-when-decoding');
            iconv.skipDecodeWarning = true;
        }

        buf = Buffer.from("" + (buf || ""), "binary"); // Ensure buffer.
    }

    var decoder = iconv.getDecoder(encoding, options);

    var res = decoder.write(buf);
    var trail = decoder.end();

    return trail ? (res + trail) : res;
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

// Search for a codec in iconv.encodings. Cache codec data in iconv._codecDataCache.
iconv._codecDataCache = {};
iconv.getCodec = function getCodec(encoding) {
    if (!iconv.encodings)
        iconv.encodings = require("../encodings"); // Lazy load all encoding definitions.
    
    // Canonicalize encoding name: strip all non-alphanumeric chars and appended year.
    var enc = iconv._canonicalizeEncoding(encoding);

    // Traverse iconv.encodings to find actual codec.
    var codecOptions = {};
    while (true) {
        var codec = iconv._codecDataCache[enc];
        if (codec)
            return codec;

        var codecDef = iconv.encodings[enc];

        switch (typeof codecDef) {
            case "string": // Direct alias to other encoding.
                enc = codecDef;
                break;

            case "object": // Alias with options. Can be layered.
                for (var key in codecDef)
                    codecOptions[key] = codecDef[key];

                if (!codecOptions.encodingName)
                    codecOptions.encodingName = enc;
                
                enc = codecDef.type;
                break;

            case "function": // Codec itself.
                if (!codecOptions.encodingName)
                    codecOptions.encodingName = enc;

                // The codec function must load all tables and return object with .encoder and .decoder methods.
                // It'll be called only once (for each different options object).
                codec = new codecDef(codecOptions, iconv);

                iconv._codecDataCache[codecOptions.encodingName] = codec; // Save it to be reused later.
                return codec;

            default:
                throw new Error("Encoding not recognized: '" + encoding + "' (searched as: '"+enc+"')");
        }
    }
}

iconv._canonicalizeEncoding = function(encoding) {
    // Canonicalize encoding name: strip all non-alphanumeric chars and appended year.
    return (''+encoding).toLowerCase().replace(/:\d{4}$|[^0-9a-z]/g, "");
}

iconv.getEncoder = function getEncoder(encoding, options) {
    var codec = iconv.getCodec(encoding),
        encoder = new codec.encoder(options, codec);

    if (codec.bomAware && options && options.addBOM)
        encoder = new bomHandling.PrependBOM(encoder, options);

    return encoder;
}

iconv.getDecoder = function getDecoder(encoding, options) {
    var codec = iconv.getCodec(encoding),
        decoder = new codec.decoder(options, codec);

    if (codec.bomAware && !(options && options.stripBOM === false))
        decoder = new bomHandling.StripBOM(decoder, options);

    return decoder;
}

// Streaming API
// NOTE: Streaming API naturally depends on 'stream' module from Node.js. Unfortunately in browser environments this module can add
// up to 100Kb to the output bundle. To avoid unnecessary code bloat, we don't enable Streaming API in browser by default.
// If you would like to enable it explicitly, please add the following code to your app:
// > iconv.enableStreamingAPI(require('stream'));
iconv.encodeStream = function encodeStream(encoding, options) {
    if (!iconv.supportsStreams)
        throw new Error("iconv-lite Streaming API is not enabled. Use iconv.enableStreamingAPI(require('stream')); to enable it.");
    return new iconv.IconvLiteEncoderStream(iconv.getEncoder(encoding, options), options);
}

iconv.decodeStream = function decodeStream(encoding, options) {
    if (!iconv.supportsStreams)
        throw new Error("iconv-lite Streaming API is not enabled. Use iconv.enableStreamingAPI(require('stream')); to enable it.");
    return new iconv.IconvLiteDecoderStream(iconv.getDecoder(encoding, options), options);
}

// NOTE: 'iconv.supportsStreams' property access will try to enable Streaming API using native 'stream' module.
// This should succeed in majority of environments.
var nativeStreamImportTried = false;
Object.defineProperty(iconv, "supportsStreams", {
    get: function() {
        if (!nativeStreamImportTried) {
            try {
                var stream_module = require("stream");
            } catch (e) {}
        
            if (stream_module && stream_module.Transform) {
                iconv.enableStreamingAPI(stream_module);
            }
            nativeStreamImportTried = true;
        }

        return !!(iconv.IconvLiteEncoderStream && iconv.IconvLiteDecoderStream);
    },
});

// Expose a way for users to explicitly enable streaming API with a dependency-injected stream module.
iconv.enableStreamingAPI = function enableStreamingAPI(stream_module) {
    // Dependency-inject stream module to create IconvLite stream classes.
    var streams = require("./streams")(stream_module);

    // Not part of a public API yet, but expose the stream classes.
    iconv.IconvLiteEncoderStream = streams.IconvLiteEncoderStream;
    iconv.IconvLiteDecoderStream = streams.IconvLiteDecoderStream;
}

// Usually iconv-lite uses lazy loading to keep import fast and memory footprint small. In some rare cases this causes problems.
// Calling this function right after require('iconv-lite') would preload all code and data files into memory to fix it.
// NOTE: This function can also be used to preload code & data for other instances of iconv-lite in your dependency tree, 
// even if they have older versions. E.g. iconv.preloadCodecsAndData(require('other_module/node_modules/iconv-lite"));
iconv.preloadCodecsAndData = function(iconv_module_to_preload) {
    var iconv = iconv_module_to_preload || module.exports;

    // Load all codecs and simple encodings
    iconv.encodingExists("");

    // Load all DBCS tables
    for (var enc in iconv.encodings) {
        var codecDef = iconv.encodings[enc];
        if (typeof codecDef === "object" && codecDef.type === '_dbcs' ) {
            if (codecDef.table)
                codecDef.table();
            if (codecDef.gb18030)
                codecDef.gb18030();
        }
    }

    // Load and initialize native streams
    iconv.supportsStreams;
}

if ("Ā" != "\u0100") {
    console.error("iconv-lite warning: js files use non-utf8 encoding. See https://github.com/ashtuchkin/iconv-lite/wiki/Javascript-source-file-encodings for more info.");
}
