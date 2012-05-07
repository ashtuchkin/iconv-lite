iconv-lite - pure javascript character encoding conversion
======================================================================

## Features

*   Easy API.
*   Works on Windows and in sandboxed environments like [Cloud9](http://c9.io) (doesn't need native code compilation).
*   Faster than iconv (see below for performance comparison).

## Usage

    var iconv = require('iconv-lite');
    
    // Convert from an encoded buffer to string.
    str = iconv.decode(buf, 'win1251');
    
    // Convert from string to an encoded buffer.
    buf = iconv.encode("Sample input string", 'win1251');

## Supported encodings

*   All node.js native encodings: 'utf8', 'ucs2', 'ascii', 'binary', 'base64'
*   All widespread single byte encodings: Windows 125x family, ISO-8859 family, 
    IBM/DOS codepages, Macintosh family, KOI8 family. 
    Aliases like 'latin1', 'us-ascii' also supported.
*   Multibyte encodings: 'gbk', 'gb2313'.

Others are easy to add, see the source. Please, participate.
Most encodings are generated from node-iconv. Thank you Ben Noordhuis and iconv authors!

Not supported yet: Big5, EUC family, Shift_JIS.


## Encoding/decoding speed

Comparison with iconv module (1000 times 256kb, on Core i5/2.5 GHz).

    operation             iconv       iconv-lite (this module)
    ----------------------------------------------------------
    encode('win1251')     19.57 mb/s  49.04 mb/s
    decode('win1251')     16.39 mb/s  24.11 mb/s


## Notes

Untranslatable characters are set to � or ?. No transliteration is currently supported, pull requests are welcome.

## Testing

    npm install --dev iconv-lite
    vows

## TODO

*   Support streaming character conversion, something like util.pipe(req, iconv.fromEncodingStream('latin1')).
*   Add more encodings.
*   Add transliteration (best fit char).
*   Add tests and correct support of variable-byte encodings (currently work is delegated to node).
