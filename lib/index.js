"use strict";

// Some environments don't have global Buffer (e.g. React Native).
// Solution would be installing npm modules "buffer" and "stream" explicitly.
var Buffer = require("safer-buffer").Buffer;

var bomHandling = require("./bom-handling"),
    iconv = module.exports;

// All codecs and aliases are kept here, keyed by encoding name/alias.
// They are lazy loaded in `iconv.getCodec` from `encodings/index.js`.
iconv.encodings = null;

// Characters emitted in case of error.
iconv.defaultCharUnicode = '�';
iconv.defaultCharSingleByte = '?';

// Public API.
iconv.encode = function encode(str, encoding, options) {
    str = "" + (str || ""); // Ensure string.
    var parts = (typeof encoding === 'string' ? encoding.toLowerCase().split('//') : null);

    if (parts && parts.length > 1) {
        encoding = parts[0];

        if (parts[1] === 'translit') {
            options = options || {};
            options.transliterate = true;
        }
    }

    var encoder = iconv.getEncoder(encoding, options);

    if (options && options.transliterate)
        encoder = new TransliterationWrapper(encoder, options);

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
    var rootName = enc;

    // Traverse iconv.encodings to find actual codec.
    var codecOptions = {};
    while (true) {
        var codec = iconv._codecDataCache[enc];
        if (codec)
            return codec;

        var codecDef = iconv.encodings[enc];

        switch (typeof codecDef) {
            case "string": // Direct alias to other encoding.
                enc = rootName = codecDef;
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

                if (!codec.encodingName)
                    codec.encodingName = rootName;

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

    encoder.encodingName = codec.encodingName;

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

String.prototype.codePointAt || (String.prototype.codePointAt = function(index) {
    var code = this.charCodeAt(index);

    if (0xD800 <= code && code <= 0xDBFF) {
        var surr = this.charCodeAt(index + 1);

        if (!isNaN(surr) && 0xDC00 <= surr && surr <= 0xDFFF)
            code = 0x10000 + ((code - 0xD800) << 10) + (surr - 0xDC00);
    }

    return code;
});

function TransliterationWrapper(encoder, options) {
    this.encoder = encoder;
    this.encodingName = encoder.encodingName + '-translit';
}

TransliterationWrapper.prototype.write = function(str) {
    return this.encoder.write(iconv.transliterate(str, this.encoder.encodingName));
};

TransliterationWrapper.prototype.end = function() {
    return this.encoder.end();
};

var unidecode;
var encodingRanges;
var translitWarnings = {};

iconv.transliterate = function transliterate(str, targetEncoding) {
    var codec = iconv.getCodec(targetEncoding);
    // Should throw an error before reaching here for an invalid encoding
    var encoding = codec.encodingName;

    if (/^(utf.*|cesu8|gb18030|ucs2|ucs4)$/.test(encoding))
        return str;

    if (!encodingRanges) {
        try {
            unidecode = require('unidecode');
        }
        catch (err) {
            throw new Error('Transliteration requires unidecode package');
        }
    }

    // For plain ASCII, we can do this quickly.
    if (encoding === 'ascii')
        return unidecode(str);

    if (!encodingRanges)
        encodingRanges = require('../encodings/tables/transliteration-ranges.json');

    var ranges = encodingRanges[encoding];

    if (!ranges) {
        if (!translitWarnings[targetEncoding]) {
            translitWarnings[targetEncoding] = true;
            console.warning('Transliteration not available for "' + targetEncoding + '".');
        }

        return str;
    }

    for (var i = 0; i < str.length; ++i) {
        var start = i;
        var cp = str.codePointAt(i);

        if (cp < 128)
            continue;
        else if (cp > 0xFFFF)
            ++i;

        var missing = true;

        for (var j = 0; j < ranges.length; ++j) {
            if (ranges[j][0] <= cp && cp <= ranges[j][1]) {
                missing = false;
                break;
            }
        }

        if (missing) {
            var len = i - start + 1;
            var substitute = unidecode(str.substr(start, len));
            str = str.substr(0, start) + substitute + str.substr(i + 1);
            i += substitute.length - len;
        }
    }

    return str;
};


// Load extensions in Node. All of them are omitted in Browserify build via 'browser' field in package.json.
var nodeVer = typeof process !== 'undefined' && process.versions && process.versions.node;
if (nodeVer) {

    // Load streaming support in Node v0.10+
    var nodeVerArr = nodeVer.split(".").map(Number);
    if (nodeVerArr[0] > 0 || nodeVerArr[1] >= 10) {
        require("./streams")(iconv);
    }

    // Load Node primitive extensions.
    require("./extend-node")(iconv);
}

if ("Ā" != "\u0100") {
    console.error("iconv-lite warning: javascript files use encoding different from utf-8. See https://github.com/ashtuchkin/iconv-lite/wiki/Javascript-source-file-encodings for more info.");
}
