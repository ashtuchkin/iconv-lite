"use strict";

// Module interface
var iconv = module.exports = {
    
    // Characters that are emitted in case of error.
    defaultCharUnicode: '�',
    defaultCharSingleByte: '?',


    // Encode string to buffer with given encoding.
    encode: function(str, encoding) {
        return this.getCodec('encoder', encoding).encode(ensureString(str));
    },

    // Decode buffer with given encoding to string.
    decode: function(buf, encoding) {
        return this.getCodec('decoder', encoding).decode(ensureBuffer(buf));
    },
    
    
    // Get correct codec for given encoding.
    // type is 'encoder' or 'decoder'
    getCodec: function(type, encoding, opts) {
        encoding = (encoding || "utf8")+"";
        
        var options = {
            aliases: [encoding],
            iconv: this,
        };
        if (typeof opts === "object")
            for (var key in opts)
                options[key] = opts[key];

        // Normalize encoding name.
        encoding = encoding.replace(/[-_ ]/g, "").toLowerCase();

        // Search for the encoding.
        while (1) {
            options.aliases.push(encoding);
            var codec = this.encodings[encoding];
            var typeofCodec = typeof codec;
            if (typeofCodec === "string") {
                // Alias to another encoding.
                encoding = codec;
            }
            else if (typeofCodec === "object" && codec[type] != undefined) {
                // Codec itself.
                return new codec[type](options);
            }
            else if (typeofCodec === "object" && codec.type != undefined) {
                // Options for other encoding.
                encoding = codec.type;
                for (var key in codec)
                    if (key !== "type")
                        options[key] = codec[key];
            }
            else
                throw new Error("Encoding not recognized: '" + options.aliases[0] + "'"+
                                " (searched as: "+options.aliases.join(" -> ")+")");
        }
    },
    
    // All encoders/decoders are kept here.
    // Keys are encoding names/aliases without '-', '_', ' '.
    // Value is either string, then it's an alias, or an object with "encoder"
    // and "decoder" fields, which are encoding and decoding classes.
    // Encoding names starting with "_" are internal.
    encodings: {},

    // Add/replace encoding definitions.
    addEncodings: function (encodings) {
        for (var key in encodings)
            this.encodings[key] = encodings[key]
    },

};

// Aliases
iconv.toEncoding = iconv.encode;
iconv.fromEncoding = iconv.decode;


// Load other encodings manually from files in /encodings dir.
iconv.addEncodings(require('./encodings/internal'));
iconv.addEncodings(require('./encodings/singlebyte'));
iconv.addEncodings(require('./encodings/table'));
iconv.addEncodings(require('./encodings/gbk'));


// Utilities
var ensureBuffer = function(buf) {
    buf = buf || new Buffer(0);
    return (buf instanceof Buffer) ? buf : new Buffer(buf.toString(), "utf8");
}

var ensureString = function(str) {
    str = str || "";
    return (str instanceof String) ? str : str.toString((str instanceof Buffer) ? 'utf8' : undefined);
}

