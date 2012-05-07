var fs  = require("fs");
var Iconv  = require("iconv").Iconv;

var files = [
    {
        name: "western",
        description: "Central and Eastern European",
        encodings: [
            {
                encoding: "WINDOWS-1250",
                name: "windows1250",
                aliases: ["win1250", "cp1250", 1250]
            },
            {
                encoding: "WINDOWS-1252",
                name: "windows1252",
                aliases: ["win1252", "cp1252", 1252]
            },
            {
                encoding: "ISO-8859-1",
                name: "iso88591",
                aliases: ["latin1", "latin-1", "cp28591", 28591]
            },
            {
                encoding: "ISO-8859-2",
                name: "iso88592",
                aliases: ["latin2", "latin-2", "cp28592", 28592]
            },
            {
                encoding: "CP850",
                name: "cp850",
                aliases: [850]
            }
        ]
    },
    {
        name: "cyrillic",
        description: "Cyrillic",
        encodings: [
            {
                encoding: "WINDOWS-1251",
                name: "windows1251",
                aliases: ["win1251", "cp1251", 1251]
            },
            {
                encoding: "ISO-8859-5",
                name: "iso88595",
                aliases: ["cp28595", 28595]
            },
            {
                encoding: "KOI8-R",
                name: "koi8r",
                aliases: ["cp20866", 20866]
            }
        ]
    },
    {
        name: "greek",
        description: "Greek",
        encodings: [
            {
                encoding: "WINDOWS-1253",
                name: "windows1253",
                aliases: ["win1253", "cp1253", 1253]
            },
            {
                encoding: "ISO-8859-7",
                name: "iso88597",
                aliases: ["greek", "greek8", "cp28597", 28597]
            },
            {
                encoding: "CP737",
                name: "cp737",
                aliases: [737]
            }
        ]
    },
    {
        name: "turkish",
        description: "Turkish",
        encodings: [
            {
                encoding: "WINDOWS-1254",
                name: "windows1254",
                aliases: ["win1254", "cp1254", 1254]
            },
            {
                encoding: "ISO-8859-9",
                name: "iso88599",
                aliases: ["turkish", "turkish8", "cp28599", 28599]
            }
        ]
    },
    {
        name: "hebrew",
        description: "Hebrew",
        encodings: [
            {
                encoding: "WINDOWS-1255",
                name: "windows1255",
                aliases: ["win1255", "cp1255", 1255]
            },
            {
                encoding: "ISO-8859-8",
                name: "iso88598",
                aliases: ["hebrew", "hebrew8", "cp28598", 28598]
            }
        ]
    },
    {
        name: "arabic",
        description: "Arabic",
        encodings: [
            {
                encoding: "WINDOWS-1256",
                name: "windows1256",
                aliases: ["win1256", "cp1256", 1256]
            },
            {
                encoding: "ISO-8859-6",
                name: "iso88596",
                aliases: ["arabic", "cp28596", 28596]
            }
        ]
    },
    {
        name: "baltic",
        description: "Estonian, Latvian and Lithuanian",
        encodings: [
            {
                encoding: "WINDOWS-1257",
                name: "windows1257",
                aliases: ["win1257", "cp1257", 1257]
            },
            {
                encoding: "ISO-8859-13",
                name: "iso885913",
                aliases: ["baltic", "cp28594", 28594]
            }
        ]
    },
    {
        name: "vietnamese",
        description: "Vietnamese",
        encodings: [
            {
                encoding: "WINDOWS-1258",
                name: "windows1258",
                aliases: ["win1258", "cp1258", 1258]
            }
        ]
    }
];

generateFiles();

function generateFiles() {
    files.forEach(function(file) {
        generateFile(file);
    });
}

function generateFile(file) {
    var fileName = "encodings/" + file.name + ".js";
    var fileContent = "";

    fileContent += "// " + file.description + " encodings\n";
    fileContent += "\n";
    fileContent += "module.exports = {\n";

    file.encodings.forEach(function(encoding) {
        fileContent += generateEncoding(encoding);
    });

    fileContent += "};\n";

    fs.writeFileSync(fileName, fileContent);
}

function generateEncoding(encoding) {
    fileContent = "";

    fileContent += '    "' + encoding.name + '": {\n';
    fileContent += '        type: "singlebyte",\n';
    fileContent += '        chars: "' + generateCharsString(encoding.encoding) + '",\n';
    fileContent += '    },\n';

    encoding.aliases.forEach(function(alias) {
        if (typeof alias === "string") {
            fileContent += '    "' + alias + '": "' + encoding.name + '",\n';
        } else {
            fileContent += '    ' + alias + ': "' + encoding.name + '",\n';
        }
    });

    fileContent += '\n';

    return fileContent;
}

function generateCharsString(encoding) {
    console.log("Generate encoding for " + encoding);
    var iconvToUtf8 = new Iconv(encoding, "utf8");
    var chars = "";

    for (var b = 0x80; b < 0x100; b++) {
        chars += byteToUnicodeEscapedString(iconvToUtf8, b);
    }

    return chars;
}

function byteToUnicodeEscapedString(iconv, b) {
    try {
        var bufferSourceEnoding = new Buffer([b])
        var bufferUtf8 = iconv.convert(bufferSourceEnoding);
        var charCode = bufferUtf8.toString().charCodeAt(0);

        return "\\u" + integerAsFourDigitHexString(charCode)
    } catch (exception) {
        if (exception.code === "EILSEQ") {
            return "\\ufffd";
        } else {
            throw exception;
        }
    }
}

function integerAsFourDigitHexString(integer) {
    var byte1 = byteToHexString(integer >> 8);
    var byte2 = byteToHexString(integer & 0xff);

    return byte1 + byte2;
}

function byteToHexString(byteValue) {
    var highNibble = (byteValue >> 4).toString(16);
    var lowNibble = (byteValue & 0x0f).toString(16);

    return highNibble + lowNibble;
}
