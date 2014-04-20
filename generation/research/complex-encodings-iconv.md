
See http://encoding.spec.whatwg.org/#indexes

##  DBCS

// Taiwan
{ enc: [ 'BIG-5', 'BIG-FIVE', 'BIG5', 'BIGFIVE', 'CN-BIG5' ],   maxChars: 2, valid: 13831, invalid: 10489 },
{ enc: [ 'BIG5-HKSCS:1999' ],                                   maxChars: 2, valid: 18284, invalid: 12180 },
{ enc: [ 'BIG5-HKSCS:2001' ],                                   maxChars: 2, valid: 18400, invalid: 12320 },
{ enc: [ 'BIG5-HKSCS:2004' ],                                   maxChars: 2, valid: 18523, invalid: 12453 },
{ enc: [ 'BIG5-HKSCS', 'BIG5HKSCS' ],                           maxChars: 2, valid: 18591, invalid: 12385 },
{ enc: [ 'CP950' ],                                             maxChars: 2, valid: 19440, invalid: 13072 },
{ enc: [ 'BIG5-2003' ],                                         maxChars: 2, valid: 19710, invalid: 12802 },

// Chinese (CP936 has a valid 0x80 code = Euro, otherwise is DBCS)
{ enc: [ 'EUC-CN', 'EUCCN', 'CN-GB', 'CSGB2312', 'GB2312' ],    maxChars: 2, valid: 7573,  invalid: 16747 },
{ enc: [ 'GBK' ],                                               maxChars: 2, valid: 21919, invalid: 10593 },
{ enc: [ 'CP936', 'MS936', 'WINDOWS-936' ],                     maxChars: 2, valid: 23334, invalid: 9178 },

// Korean, 
// See http://en.wikipedia.org/wiki/KS_X_1001, http://support.microsoft.com/kb/170557
// KSC-5601_1992 = Johab (rarely used), http://opensource.apple.com/source/tcl/tcl-10/tcl/tools/encoding/ksc5601.txt
// Add char: http://mail.openjdk.java.net/pipermail/core-libs-dev/2013-May/017472.html
{ enc: [ 'EUC-KR', 'EUCKR', 'CSEUCKR' ],                        maxChars: 2, valid: 8355,  invalid: 15965 },
{ enc: [ 'CP1361', 'JOHAB' ],                   isASCII: false, maxChars: 2, valid: 17177, invalid: 11751 },
{ enc: [ 'CP949', 'UHC' ],                                      maxChars: 2, valid: 17364, invalid: 15148 },


## NOT DBCS

// Japanese: Shift_JIS (add MacJapanese) - includes double-chars and chars from 2nd plane (i.e. U+2131B).
// http://x0213.org/codetable/sjis-0213-2004-std.txt
// X0213 - superset, see http://x0213.org/codetable/index.en.html
// Ibm 943 = CP 932 (with x5C -> A5, not 5C). See also Ibm 942
{ enc: [ 'SHIFT_JIS', 'CSSHIFTJIS', 'MS_KANJI', 'SHIFT-JIS', 'SJIS' ],      isASCII: false, maxChars: 2, valid: 8950, invalid: 4618 },
{ enc: [ 'CP932' ],                                                                         maxChars: 2, valid: 9795, invalid: 5821 },
{ enc: [ 'SHIFT_JISX0213' ],                                                isASCII: false, maxChars: 2, valid: 11424, invalid: 4192 },

// Japanese: EUC-JP - includes double chars and chars from 2nd plane.
// http://x0213.org/codetable/euc-jis-2004-std.txt
{ enc: [ 'EUC-JP', 'CSEUCPKDFMTJAPANESE', 'EUCJP' ],                        maxChars: 3, valid: 15017, invalid: 33879 },
{ enc: [ 'EUC-JISX0213' ],                                                  maxChars: 3, valid: 11424, invalid: 37472 },

// Japanese TODO: ISO-IR-87, JIS0208, JIS_C6226-1983, JIS_X0208, JIS_X0208-1983, JIS_X0208-1990, X0208, CSISO87JISX0208
// ISO-IR-159, JIS_X0212, JIS_X0212-1990, JIS_X0212.1990-0, X0212, CSISO159JISX02121990
// Aliases:
// CHINESE, GB_2312-80 = ISO-IR-58 = CSISO58GB231280
// KOREAN, ISO-IR-149 = KSC_5601 = KS_C_5601-1987 = KS_C_5601-1989 = CSKSC56011987

// Taiwan, rare
{ enc: [ 'EUC-TW', 'EUCTW', 'CSEUCTW' ],                                    maxChars: 4, valid: 61439, invalid: 16805889 },

// GBK extension
{ enc: [ 'GB18030' ],                                                       maxChars: 4, valid: 1112064, invalid: 27531008 },

// Stateful ISO-2022 encodings, with switches to different planes.
{ enc: [ 'ISO-2022-CN', 'CSISO2022CN', 'ISO-2022-CN-EXT' ],     maxChars: 4 },
{ enc: [ 'ISO-2022-KR', 'CSISO2022KR' ],                        maxChars: 4 },
{ enc: [ 'ISO-2022-JP-1', 'ISO-2022-JP-2', 'CSISO2022JP2', 'ISO-2022-JP-3' ],    maxChars: 4 },
{ enc: [ 'ISO-2022-JP', 'CSISO2022JP' ],                        maxChars: 3 },

// Unknown 
{ enc: [ 'CN-GB-ISOIR165', 'ISO-IR-165' ], maxChars: 2, valid: 8421, invalid: 15387 },
{ enc: [ 'HZ', 'HZ-GB-2312' ], maxChars: 2 },
{ enc: [ 'DEC-KANJI' ], isDBCS: true, isASCII: true, maxChars: 2, valid: 7007, invalid: 14753 },
{ enc: [ 'DEC-HANYU' ], isDBCS: false, isASCII: true, maxChars: 4, valid: 20039, invalid: 70073 },



## UNICODE

{ enc: [ 'UCS-2',   'CSUNICODE', 'ISO-10646-UCS-2' ],   maxChars: 2 },
{ enc: [ 'UCS-2BE', 'UNICODEBIG', 'UNICODE-1-1', 'CSUNICODE11', 'UCS-2-SWAPPED' ],  maxChars: 2 },
{ enc: [ 'UCS-2LE', 'UNICODELITTLE', 'UCS-2-INTERNAL' ],                  maxChars: 2 },

{ enc: [ 'UCS-4', 'CSUCS4', 'ISO-10646-UCS-4' ],        maxChars: 4 },
{ enc: [ 'UCS-4BE', 'UCS-4-SWAPPED' ],                  maxChars: 4 },
{ enc: [ 'UCS-4LE', 'WCHAR_T', 'UCS-4-INTERNAL' ],      maxChars: 4 },

{ enc: [ 'UTF-7', 'UTF7', 'UNICODE-1-1-UTF-7', 'CSUNICODE11UTF7' ], maxChars: 8 },
{ enc: [ 'UTF-8', 'UTF8' ],                             maxChars: 4 },
{ enc: [ 'UTF-16', 'UTF-16BE', 'UTF16', 'UTF16BE' ],    maxChars: 4 },
{ enc: [ 'UTF-16LE', 'UTF16LE' ],                       maxChars: 4 },
{ enc: [ 'UTF-32', 'UTF32' ],                           maxChars: 4 },
{ enc: [ 'UTF-32BE', 'UTF32BE' ],                       maxChars: 4 },
{ enc: [ 'UTF-32LE', 'UTF32LE' ],                       maxChars: 4 },

## Not covered

http://en.wikipedia.org/wiki/Punycode

