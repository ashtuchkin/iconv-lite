var iconv = require('../lib/index');
var fs = require('fs');

// Make sure we can tell missing characters apart from question marks.
iconv.defaultCharSingleByte = '\u0000';

// Trigger loading of encodings
iconv.getCodec('ascii');

var encodings = Object.keys(iconv.encodings).filter(function(enc) {
    return enc.charAt(0) !== '_' && typeof iconv.encodings[enc] !== 'string';
}).sort();

var allCharsStr = '';
var skip = 0;

for (var i = 0; i <= 0x10F7FF; ++i) {
    if (i === 0xD800)
        skip = 0x800;

    allCharsStr += String.fromCodePoint(i + skip);
}

var encodingRanges = {};

encodings.forEach(function(enc) {
    var chars = iconv.decode(iconv.encode(allCharsStr, enc), enc);
    var ranges = [];
    var start = -1;

    // Yes, less-than-or-equal, deliberately going one extra character beyond the end of the string.
    for (var i = 0; i <= chars.length; ++i) {
        var cp = chars.codePointAt(i);

        var badChar = (isNaN(cp) || cp === 0 || cp === 0xFFFD);

        if (i !== 0 && i !== 0xF7FD && i !== 0xFFFD) {
            if (start < 0 && !badChar)
                start = (i === 1 ? 0 : i);
            else if (start >= 0 && badChar) {
                ranges.push([start, i - 1]);
                start = -1;

                if (ranges.length > 255)
                    break;
            }
        }

        if (cp > 0xFFFF)
            ++i;
    }

    encodingRanges[enc] = ranges;
});

var json = JSON.stringify(encodingRanges);

json = json.replace(/(.{80}.*?(,|$))/g, '$1\n') + '\n';
fs.writeFileSync(__dirname + '/../encodings/tables/transliteration-ranges.json', json);
