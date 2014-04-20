var vows = require('vows'),
    assert = require('assert'),
    iconv = require(__dirname+'/../'),
    Iconv = require('iconv').Iconv;

// All single-byte encodings supported by libiconv.
var encodings = ["437","CP437","CSPC8CODEPAGE437","IBM437","850","CP850","CSPC850MULTILINGUAL","IBM850","852","CP852","CSPCP852","IBM852","855","CP855","CSIBM855","IBM855","857","CP857","CSIBM857","IBM857","860","CP860","CSIBM860","IBM860","861","CP861","IBM861","862","CP862","CSPC862LATINHEBREW","IBM862","863","CP863","CSIBM863","IBM863","865","CP865","CSIBM865","IBM865","866","CP866","CSIBM866","IBM866","869","CP-GR","CP869","CSIBM869","IBM869","ANSI_X3.4-1968","ANSI_X3.4-1986","ASCII","CP367","CSASCII","IBM367","ISO-IR-6","ISO646-US","ISO_646.IRV:1991","US-ASCII","US","ARABIC","ASMO-708","CSISOLATINARABIC","ECMA-114","ISO-8859-6","ISO-IR-127","ISO8859-6","ISO_8859-6","ISO_8859-6:1987","ARMSCII-8","CN","GB_1988-80","ISO-IR-57","ISO646-CN","CP737","CP775","CSPC775BALTIC","IBM775","CP819","CSISOLATIN1","IBM819","ISO-8859-1","ISO-IR-100","ISO8859-1","ISO_8859-1","ISO_8859-1:1987","L1","LATIN1","CP856","CP864","CSIBM864","IBM864","CP874","WINDOWS-874","CP922","CP1046","CP1124","CP1125","CP1129","CP1133","CP1161","CSIBM1161","IBM-1161","IBM1161","CP1162","IBM-1162","IBM1162","CP1163","CP1250","MS-EE","WINDOWS-1250","CP1251","MS-CYRL","WINDOWS-1251","CP1252","MS-ANSI","WINDOWS-1252","CP1253","MS-GREEK","WINDOWS-1253","CP1254","MS-TURK","WINDOWS-1254","CP1255","MS-HEBR","WINDOWS-1255","CP1256","MS-ARAB","WINDOWS-1256","CP1257","WINBALTRIM","WINDOWS-1257","CP1258","WINDOWS-1258","CSHPROMAN8","HP-ROMAN8","R8","ROMAN8","CSISO14JISC6220RO","ISO-IR-14","ISO646-JP","JIS_C6220-1969-RO","JP","CSISOLATIN2","ISO-8859-2","ISO-IR-101","ISO8859-2","ISO_8859-2","ISO_8859-2:1987","L2","LATIN2","CSISOLATIN3","ISO-8859-3","ISO-IR-109","ISO8859-3","ISO_8859-3","ISO_8859-3:1988","L3","LATIN3","CSISOLATIN4","ISO-8859-4","ISO-IR-110","ISO8859-4","ISO_8859-4","ISO_8859-4:1988","L4","LATIN4","CSISOLATIN5","ISO-8859-9","ISO-IR-148","ISO8859-9","ISO_8859-9","ISO_8859-9:1989","L5","LATIN5","CSISOLATIN6","ISO-8859-10","ISO-IR-157","ISO8859-10","ISO_8859-10","ISO_8859-10:1992","L6","LATIN6","CSISOLATINCYRILLIC","CYRILLIC","ISO-8859-5","ISO-IR-144","ISO8859-5","ISO_8859-5","ISO_8859-5:1988","CSISOLATINGREEK","ECMA-118","ELOT_928","GREEK","GREEK8","ISO-8859-7","ISO-IR-126","ISO8859-7","ISO_8859-7","ISO_8859-7:1987","ISO_8859-7:2003","CSISOLATINHEBREW","HEBREW","ISO-8859-8","ISO-IR-138","ISO8859-8","ISO_8859-8","ISO_8859-8:1988","CSKOI8R","KOI8-R","CSMACINTOSH","MAC","MACINTOSH","GEORGIAN-ACADEMY","GEORGIAN-PS","ISO-8859-11","ISO8859-11","ISO-8859-13","ISO-IR-179","ISO8859-13","L7","LATIN7","ISO-8859-14","ISO-CELTIC","ISO-IR-199","ISO8859-14","ISO_8859-14","ISO_8859-14:1998","L8","LATIN8","ISO-8859-15","ISO-IR-203","ISO8859-15","ISO_8859-15","ISO_8859-15:1998","LATIN-9","ISO-8859-16","ISO-IR-226","ISO8859-16","ISO_8859-16","ISO_8859-16:2001","L10","LATIN10","ISO-IR-166","TIS-620","TIS620-0","TIS620.2529-1","TIS620.2533-0","TIS620","KOI8-RU","KOI8-T","KOI8-U","MACCYRILLIC","PT154","RK1048","STRK1048-2002","TCVN-5712","TCVN","TCVN5712-1","TCVN5712-1:1993","VISCII"];

function convertWithDefault(converter, buf, def) {
    var res = converter.convert(buf);
    return res.length > 0 ? res : def;
}

var testsBatch = {};
encodings.forEach(function(enc) {
    testsBatch[enc] = function() {
        // Check we decode the same as the Iconv.
        var conv = new Iconv(enc, "utf-8//IGNORE");
        var maxCode = 1024;
        for (var i = 0; i < 0x100; i++) {
            var buf = new Buffer([i]);
            var decoded = iconv.decode(buf, enc);
            maxCode = Math.max(maxCode, decoded.charCodeAt(0));
            assert.strictEqual(
                convertWithDefault(conv, buf, iconv.defaultCharUnicode).toString(),
                decoded);
        }

        // Check we encode the same as the Iconv.
        var convBack = new Iconv("utf-8", enc + "//IGNORE");
        var enc2 = enc.replace(/[-_ ]|:\d{4}$/g, "").toLowerCase(); // Strip all unneeded symbols

        if (iconv.getType(iconv.encodings[enc2]) === "Object") { // Skip aliases.
            for (var i = 0; i < 0xFFF0; i++) {
                if (i == maxCode) i = 0xFFF0; // Speed up testing.
                if (i == 0xD800) i = 0xF900; // Skip surrogates & private use, Specials
                var str = String.fromCharCode(i);
                var buf1 = convertWithDefault(convBack, str, new Buffer(iconv.defaultCharSingleByte)).toString('hex');
                var buf2 = iconv.encode(str, enc).toString('hex');
                if (buf1 != buf2) {
                    // TODO: Implement unicode composition.
                    // Currently don't check these scenarios.
                    var str1 = iconv.decode(new Buffer(buf1, 'hex'), enc);
                    var str2 = iconv.decode(new Buffer(buf2, 'hex'), enc);
                    var equivalent = {'\u00d0': '\u0110', '\u203e': '\u00AF', '\u0340': '\u0300', '\u0341': '\u0301'};
                    if (str2 != '?' || (buf1.length == 2 && equivalent[str] != str1)) { 
                        console.log(enc, i.toString(16), buf1, buf2);
                        assert.strictEqual(buf1, buf2);
                    }
                }
            }
        }

        /*
        // TODO: Implement unicode composition. After that, this test will be meaningful.

        // Create a large random text.
        var buf2 = new Buffer(100);
        for (var i = 0; i < buf2.length; i++)
            buf2[i] = buf[(Math.random()*buf.length) | 0];

        // Check both encoding and decoding.
        assert.strictEqual(JSON.stringify(iconv.decode(buf2, enc)), JSON.stringify(str = conv.convert(buf2).toString()));
        assert.strictEqual(iconv.encode(str, enc).toString('hex'), convBack.convert(new Buffer(str)).toString('hex'));
        */
    };
});

vows.describe("Test iconv single-byte encodings").addBatch(testsBatch).export(module);

