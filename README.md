## Pure JS character encoding conversion

<!-- [![Build Status](https://secure.travis-ci.org/ashtuchkin/iconv-lite.png?branch=master)](http://travis-ci.org/ashtuchkin/iconv-lite) -->

 * Doesn't need native code compilation. Works on Windows and in sandboxed environments like [Cloud9](http://c9.io).
 * Used in popular projects like [Grunt](http://gruntjs.com/), [Nodemailer](http://www.nodemailer.com/), [Yeoman](http://yeoman.io/) and others.
 * Faster than [node-iconv](https://github.com/bnoordhuis/node-iconv) (see below for performance comparison).
 * Intuitive encode/decode API.
 * License: MIT.

[![NPM Stats](https://nodei.co/npm/iconv-lite.png?downloads=true)](https://npmjs.org/packages/iconv-lite/)

## Usage

    var iconv = require('iconv-lite');
    
    // Convert from an encoded buffer to js string.
    str = iconv.decode(buf, 'win1251');
    
    // Convert from js string to an encoded buffer.
    buf = iconv.encode("Sample input string", 'win1251');

    // Check if encoding is supported
    iconv.encodingExists("us-ascii")

## Supported encodings

 *  All node.js native encodings: 'utf8', 'ucs2', 'ascii', 'binary', 'base64'
 *  All widespread single byte encodings: Windows 125x family, ISO-8859 family, 
    IBM/DOS codepages, Macintosh family, KOI8 family. 
    Aliases like 'latin1', 'us-ascii' also supported.
 *  Multibyte encodings: 'gbk', 'gb2313', 'Big5', 'cp950'.

Others are easy to add, see the source. Please, participate.
Most encodings are generated automatically from [node-iconv](https://github.com/bnoordhuis/node-iconv). Thank you Ben Noordhuis and iconv authors!

Not supported yet: EUC family, Shift_JIS.


## Encoding/decoding speed

Comparison with node-iconv module (1000x256kb, on Ubuntu 12.04, Core i5/2.5 GHz, Node v0.10.25). 
Note: your results may vary, so please always check on your hardware.

    operation             iconv@2.0.7   iconv-lite@0.2.11 
    ----------------------------------------------------------
    encode('win1251')     ~115 Mb/s     ~237 Mb/s
    decode('win1251')     ~95 Mb/s      ~130 Mb/s


## Notes

When decoding, a 'binary'-encoded string can be used as a source buffer.  
Untranslatable characters are set to � or ?. No transliteration is currently supported, pull requests are welcome.

## Testing

    git clone git@github.com:ashtuchkin/iconv-lite.git
    cd iconv-lite
    npm install
    npm test
    
    # To view performance:
    node test/performance.js

## TODO

 * Support streaming character conversion, something like util.pipe(req, iconv.fromEncodingStream('latin1')).
 * Add more encodings.
 * Add transliteration (best fit char).
 * Add tests and correct support of variable-byte encodings (currently work is delegated to node).

## Adoption
[![NPM](https://nodei.co/npm-dl/iconv-lite.png)](https://nodei.co/npm/iconv-lite/)
