// Cyrillic encodings
// Easy way to get chars for encoding, f.ex python:  ''.join(map(chr, range(128, 256))).decode('windows-1251', 'replace')
// TODO: bestfit (http://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WindowsBestFit/bestfit1251.txt)

module.exports = {
    // Win1251: http://msdn.microsoft.com/en-us/goglobal/cc305144
    // http://unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WindowsBestFit/bestfit1251.txt
    "windows1251": {
        type: "singlebyte",
        chars: "ЂЃ‚ѓ„…†‡€‰Љ‹ЊЌЋЏђ‘’“”•–—�™љ›њќћџ ЎўЈ¤Ґ¦§Ё©Є«¬\xAD®Ї°±Ііґµ¶·ё№є»јЅѕїАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя"
    },
    "win1251": "windows1251",
    "cp1251": "windows1251",
    "1251": "windows1251",
    1251: "windows1251",

    // KOI8-R: http://tools.ietf.org/html/rfc1489
    // http://unicode.org/Public/MAPPINGS/VENDORS/MISC/KOI8-R.TXT
    "koi8r": {
        type: 'singlebyte',
        chars: '─│┌┐└┘├┤┬┴┼▀▄█▌▐░▒▓⌠■∙√≈≤≥ ⌡°²·÷═║╒ё╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡Ё╢╣╤╥╦╧╨╩╪╫╬©юабцдефгхийклмнопярстужвьызшэщчъЮАБЦДЕФГХИЙКЛМНОПЯРСТУЖВЬЫЗШЭЩЧЪ'
    },
    "cp20866": "koi8r",
    20866: "koi8r",
    
    // ISO-8859-5:
    // http://unicode.org/Public/MAPPINGS/ISO8859/8859-5.TXT
    "iso88595": {
        type: 'singlebyte',
        chars: ' ЁЂЃЄЅІЇЈЉЊЋЌ­ЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя№ёђѓєѕіїјљњћќ§ўџ'
    },
    "cp28595": "iso88595",
    28595: "iso88595"
};

