var utils = require("./utils"), 
    errTo = require("errto"),
    async = require("async");

async.parallel({
    $big5: utils.getFile.bind(null, "http://moztw.org/docs/big5/table/moz18-b2u.txt"), // Encodings with $ are not saved. They are used to calculate other encs.
    $gbk:  utils.getFile.bind(null, "http://encoding.spec.whatwg.org/index-gb18030.txt"),
    $cp932: utils.getFile.bind(null, "http://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP932.TXT"),
    cp936: utils.getFile.bind(null, "http://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP936.TXT"),
    cp949: utils.getFile.bind(null, "http://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP949.TXT"),
    cp950: utils.getFile.bind(null, "http://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP950.TXT"),
    shiftjis: utils.getFile.bind(null, "http://www.unicode.org/Public/MAPPINGS/OBSOLETE/EASTASIA/JIS/SHIFTJIS.TXT"),
}, errTo(console.log, function(data) {
    // First, parse all files.
    for (var enc in data) {
        var dbcs = {};
        utils.parseText(data[enc]).map(function(a) {
            var dbcsCode = parseInt(a[0]);
            var unicode = parseInt(a[1]);
            if (!isNaN(unicode))
                dbcs[dbcsCode] = unicode;
        });
        data[enc] = dbcs;
    }

    // Calculate difference between big5 and cp950, and write it to a file.
    var big5add = {}
    for (var k in data.$big5)
        if (data.cp950[k] === undefined)
            big5add[k] = data.$big5[k];

    utils.writeTable("big5-added", utils.generateTable(big5add));

    // Calculate difference between GB18030 encoding and cp936.
    // See http://encoding.spec.whatwg.org/#gb18030-encoder
    var gbkadd = {}
    for (var i = 0x8100; i < 0x10000; i++) { // Lead byte is 0x81 .. 0xFE
        var trail = i & 0xFF;
        if (trail < 0x40 || trail === 0x7F || trail > 0xFE) continue;
        var lead = i >> 8;
        var offset = (trail < 0x7F) ? 0x40 : 0x41;
        var gbAddr = (lead - 0x81) * 190 + (trail - offset); 
        var cpChar = data.cp936[i];
        var gbChar = data.$gbk[gbAddr];
        if ((cpChar !== undefined) && (cpChar != gbChar))
            console.log("Dont match: ", i.toString(16), gbAddr.toString(16), gbChar, cpChar);

        if (cpChar === undefined)
            gbkadd[i] = gbChar;
    }
    // Fix incorrect mapping in http://encoding.spec.whatwg.org/index-gb18030.txt
    // Filed bug https://www.w3.org/Bugs/Public/show_bug.cgi?id=25396
    gbkadd[0xA3A0] = 0xE5E5;

    utils.writeTable("gbk-added", utils.generateTable(gbkadd));


    // Add missing chars to ShiftJIS
    for (var i = 0; i < 0x20; i++)
        data.shiftjis[i] = i;
    data.shiftjis[0x7F] = 0x7F;

    // Create cp932-added
    var cp932add = {};
    for (var k in data.$cp932)
        if (data.shiftjis[k] !== data.$cp932[k])
            cp932add[k] = data.$cp932[k];

    utils.writeTable("cp932-added", utils.generateTable(cp932add));


    // Write all plain tables to as-is.
    for (var enc in data)
        if (enc[0] != "$") 
            utils.writeTable(enc, utils.generateTable(data[enc]));


    console.log("Encodings regenerated.");
}));


