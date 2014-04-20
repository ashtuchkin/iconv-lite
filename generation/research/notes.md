
### TODO:
 * Deprecate string input in decoding (with tests).

 * keep internal state in encoders/decoders
 * streaming suport

Later:
 * browser support through ArrayBuffer
   -> table support via utf-8 strings with ranges.



### Other projects
http://code.google.com/p/stringencoding/
http://encoding.spec.whatwg.org

### Browser alternatives of Buffer
http://www.khronos.org/registry/typedarray/specs/latest/
https://developer.mozilla.org/en-US/docs/JavaScript_typed_arrays
ArrayBuffer polyfill http://www.calormen.com/polyfill/ https://bitbucket.org/lindenlab/llsd/src/7d2646cd3f9b/js/typedarray.js


### Streaming hurdles
 
 * BOM in UTF-16
 * Surrogate chars
    UTF-16BE/16LE: Surrogate chars not streamable.
    CESU-8: Surrogate chars from UTF-8
 * Combining characters (see normalization.txt)


### General

Everything goes to native javascript UTF16 (with surrogate pairs) and from it.
 * Decoder: takes buffer(s), returns string & bytes consumed.
 * Encoder: takes string, returns buf & chars consumed.

when encoding, a state must be held in case there's a surrogate pair somewhere.

Decoder:
string write(buf) (keep state)
string end() (emit remaining chars)

OR

processedBytes decode(buf, write(str))

OR

TextDecoder
string decode(buf, {stream: true})


### General structure
iconv.encodings = {} all encodings, aliases, tables.

Encoding = 
 1. Name + aliases (small, manual+generated)
 2. Codec (med, manual)
 3. Data/Table (large, generated)

/encodings/index.js - loads all needed files to fill iconv.encodings.
/encodings/sbcs-codec.js, dbcs-codec.js - code to convert.
/encodings/sbcs-data.js, .. - aliases/tables to use.
/encodings/tables/cp950.json - (generally large) tables to be used with dbcs.


