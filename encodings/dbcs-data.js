
// Description of supported dbcs encodings and aliases. Tables are not require()-d
// until they are needed.

module.exports = {
    
    // == Japanese/ShiftJIS ====================================================
    // CP932 is an extension of Shift_JIS (JIS 0208) with ASCII bottom
    'windows932': 'cp932',
    '932': 'cp932',
    'cp932': {
        type: '_dbcs',
        table: ['./tables/shiftjis.json', './tables/cp932-added.json'],
    },


    'shiftjis': {
        type: '_dbcs',
        table: './tables/shiftjis.json',
    },
    'csshiftjis': 'shiftjis',
    'mskanji': 'shiftjis',

    // TODO: KDDI extension to Shift_JIS
    // TODO: IBM CCSID 942 = CP932, but F0-F9 custom chars and other char changes.
    // TODO: IBM CCSID 943 = Shift_JIS = CP932 with original Shift_JIS lower 128 chars.

    // == Chinese/GBK ==========================================================
    // http://en.wikipedia.org/wiki/GBK

    // Oldest GB2312 (1981, ~7600 chars) is a subset of CP936
    'gb2312': 'cp936',

    // Microsoft's CP936 is a subset and approximation of GBK.
    // TODO: Euro = 0x80 in cp936, but not in GBK (where it's valid but undefined)
    'windows936': 'cp936',
    '936': 'cp936',
    'cp936': {
        type: '_dbcs',
        table: './tables/cp936.json',
    },

    // GBK (~22000 chars) is an extension of CP936 that added user-mapped chars and some other.
    'gbk': {
        type: '_dbcs',
        table: ['./tables/cp936.json', './tables/gbk-added.json'],
    },

    // TODO: Support GB18030 (~27000 chars + whole unicode mapping, cp54936)
    // http://icu-project.org/docs/papers/gb18030.html
    // http://source.icu-project.org/repos/icu/data/trunk/charset/data/xml/gb-18030-2000.xml
    // http://www.khngai.com/chinese/charmap/tblgbk.php?page=0

    // == Korean ===============================================================
    'windows949': 'cp949',
    '949': 'cp949',
    'cp949': {
        type: '_dbcs',
        table: './tables/cp949.json',
    },

    "ksc56011987": "cp949",


    // == Taiwan/Big5 ==========================================================
    'windows950': 'cp950',
    '950': 'cp950',
    'cp950': {
        type: '_dbcs',
        table: './tables/cp950.json',
    },

    // Big5 has many variations and is an extension of cp950. We use Mozilla's as a consensus.
    'big5': {
        type: '_dbcs',
        table: ['./tables/cp950.json', './tables/big5-added.json'],
    },

};