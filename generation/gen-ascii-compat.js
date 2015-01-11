var fs = require("fs"),
    path = require("path");

var destFileName = "encodings/ascii-compat-generated.js";

var encodings = require(path.join(__dirname, "..", "encodings")),
    names = Object.keys(encodings),
    // start off with some known ASCII-compatible charsets that are supported
    // internally
    compat = [ "utf8", "unicode11utf8", "ascii" ];

for (var i = 0, len = names.length, enc; i < len; ++i) {
  enc = names[i];
  if (~compat.indexOf(enc) || typeof encodings[enc] === "function")
    continue;

  var done = false,
      nextenc = enc,
      opts;
  while (!done) {
    var codec = encodings[nextenc];

    switch (typeof codec) {
      case "string": // Direct alias to other encoding.
        nextenc = codec;
        break;

      case "object": // Alias with options. Can be layered.
        if (!opts) {
          opts = codec;
          opts.encodingName = nextenc;
        } else {
          for (var key in codec)
            opts[key] = codec[key];
        }

        nextenc = codec.type;
        break;

      default:
        done = true;
    }
  }

  if (opts && opts.chars && opts.chars.length === 128)
    compat.push(enc);
}

compat.sort();

encodings = {};
for (var i = 0, len = compat.length; i < len; ++i)
  encodings[compat[i]] = true;

// Write encodings.
fs.writeFileSync(path.join(__dirname, "..", destFileName),
    "\n// Generated data for ASCII-compatible codecs. Don't edit manually. Regenerate using generation/gen-ascii-compat.js script.\n"+
    "module.exports = "+JSON.stringify(encodings, undefined, "  "));
