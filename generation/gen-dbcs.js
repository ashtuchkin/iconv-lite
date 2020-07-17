/* eslint no-console: "off" */
"use strict";

const utils = require("./utils"),
    errTo = require("errto"),
    async = require("async");

async.parallel(
    // prettier-ignore
    {
    $big5: utils.getFile.bind(null, "http://encoding.spec.whatwg.org/index-big5.txt"), // Encodings with $ are not saved. They are used to calculate other encs.
    $gbk:  utils.getFile.bind(null, "http://encoding.spec.whatwg.org/index-gb18030.txt"),
    $gbRanges: utils.getFile.bind(null, "http://encoding.spec.whatwg.org/index-gb18030-ranges.txt"),
    $eucKr: utils.getFile.bind(null, "http://encoding.spec.whatwg.org/index-euc-kr.txt"),
    $jis0208: utils.getFile.bind(null, "http://encoding.spec.whatwg.org/index-jis0208.txt"),
    $jis0212: utils.getFile.bind(null, "http://encoding.spec.whatwg.org/index-jis0212.txt"),
    $cp932: utils.getFile.bind(null, "http://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP932.TXT"),
    cp936: utils.getFile.bind(null, "http://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP936.TXT"),
    cp949: utils.getFile.bind(null, "http://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP949.TXT"),
    cp950: utils.getFile.bind(null, "http://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP950.TXT"),
},
    errTo(console.log, function (data) {
        // First, parse all files.
        for (const enc in data) {
            const dbcs = {};
            utils.parseText(data[enc]).map(function (a) {
                const dbcsCode = parseInt(a[0]);
                const unicode = parseInt(a[1]);
                if (!isNaN(unicode)) dbcs[dbcsCode] = unicode;
            });
            data[enc] = dbcs;
        }

        // Calculate difference between big5 and cp950, and write it to a file.
        // See http://encoding.spec.whatwg.org/#big5-encoder
        const big5add = {};
        for (let i = 0x8100; i < 0x10000; i++) {
            // Lead byte is 0x81 .. 0xFE
            const trail = i & 0xff;
            if (trail < 0x40 || (0x7e < trail && trail < 0xa1) || trail > 0xfe) continue;
            const lead = i >> 8;
            const offset = trail < 0x7f ? 0x40 : 0x62;
            const pointer = (lead - 0x81) * 157 + (trail - offset);
            const cpChar = data.cp950[i];
            const big5Char = data.$big5[pointer];
            if (big5Char !== undefined && cpChar !== big5Char) big5add[i] = big5Char;
        }

        // Add char sequences that are not in the index file (as given in http://encoding.spec.whatwg.org/#big5-encoder)
        function toIdx(pointer) {
            const trail = pointer % 157;
            const lead = Math.floor(pointer / 157) + 0x81;
            return (lead << 8) + (trail + (trail < 0x3f ? 0x40 : 0x62));
        }
        big5add[toIdx(1133)] = [0x00ca, 0x0304];
        big5add[toIdx(1135)] = [0x00ca, 0x030c];
        big5add[toIdx(1164)] = [0x00ea, 0x0304];
        big5add[toIdx(1166)] = [0x00ea, 0x030c];

        utils.writeTable("big5-added", utils.generateTable(big5add));

        // Calculate difference between GB18030 encoding and cp936.
        // See http://encoding.spec.whatwg.org/#gb18030-encoder
        const gbkadd = {};
        for (let i = 0x8100; i < 0x10000; i++) {
            // Lead byte is 0x81 .. 0xFE
            const trail = i & 0xff;
            if (trail < 0x40 || trail === 0x7f || trail > 0xfe) continue;
            const lead = i >> 8;
            const offset = trail < 0x7f ? 0x40 : 0x41;
            const gbAddr = (lead - 0x81) * 190 + (trail - offset);
            const cpChar = data.cp936[i];
            const gbChar = data.$gbk[gbAddr];
            if (cpChar !== undefined && cpChar !== gbChar)
                console.log("Dont match: ", i.toString(16), gbAddr.toString(16), gbChar, cpChar);

            if (gbChar !== undefined && cpChar !== gbChar) gbkadd[i] = gbChar;
        }

        // GB18030:2005 addition
        const gbk2005add = [["8135f437", ""]];

        utils.writeTable("gbk-added", utils.generateTable(gbkadd).concat(gbk2005add));

        // Write GB18030 ranges
        const ranges = { uChars: [], gbChars: [] };
        for (const k in data.$gbRanges) {
            ranges.uChars.push(data.$gbRanges[k]);
            ranges.gbChars.push(+k);
        }
        utils.writeFile("gb18030-ranges", JSON.stringify(ranges));

        // Use http://encoding.spec.whatwg.org/#shift_jis-decoder
        const shiftjis = {};
        for (let i = 0; i <= 0x80; i++) shiftjis[i] = i;
        for (let i = 0xa1; i <= 0xdf; i++) shiftjis[i] = 0xff61 + i - 0xa1;

        for (let lead = 0x81; lead < 0xff; lead++)
            if (lead < 0xa1 || lead > 0xdf)
                for (let byte = 0; byte < 0xff; byte++) {
                    const offset = byte < 0x7f ? 0x40 : 0x41;
                    const leadOffset = lead < 0xa0 ? 0x81 : 0xc1;
                    if ((0x40 <= byte && byte <= 0x7e) || (0x80 <= byte && byte <= 0xfc)) {
                        const pointer = (lead - leadOffset) * 188 + byte - offset;
                        if (data.$jis0208[pointer])
                            shiftjis[(lead << 8) + byte] = data.$jis0208[pointer];
                        else if (8836 <= pointer && pointer <= 10528)
                            shiftjis[(lead << 8) + byte] = 0xe000 + pointer - 8836; // Interoperable legacy from Windows known as EUDC
                    }
                }

        utils.writeTable("shiftjis", utils.generateTable(shiftjis));

        // Fill out EUC-JP table according to http://encoding.spec.whatwg.org/#euc-jp
        const eucJp = {};
        for (let i = 0; i < 0x80; i++) eucJp[i] = i;
        for (let i = 0xa1; i <= 0xdf; i++) eucJp[(0x8e << 8) + i] = 0xff61 + i - 0xa1;
        for (let i = 0xa1; i <= 0xfe; i++)
            for (let j = 0xa1; j <= 0xfe; j++) {
                eucJp[(i << 8) + j] = data.$jis0208[(i - 0xa1) * 94 + (j - 0xa1)];
                eucJp[(0x8f << 16) + (i << 8) + j] = data.$jis0212[(i - 0xa1) * 94 + (j - 0xa1)];
            }

        utils.writeTable("eucjp", utils.generateTable(eucJp, 3));

        // Fill out EUC-KR Table and check that it is the same as cp949.
        const eucKr = {};
        for (let i = 0; i < 0x80; i++) eucKr[i] = i;
        for (let i = 0x8100; i < 0xff00; i++) {
            const lead = i >> 8,
                byte = i & 0xff;
            let ptr = null;
            if (0x41 <= byte && byte <= 0xfe) ptr = (lead - 0x81) * 190 + (byte - 0x41);
            if (ptr !== null) eucKr[i] = data.$eucKr[ptr];

            // Compare with cp949
            if (data.cp949[i] !== eucKr[i])
                console.log(
                    "Warning: EUC-KR from Encoding Standard doesn't match with CP949 from Unicode.com: ",
                    i,
                    data.cp949[i],
                    eucKr[i]
                );
        }

        // Write all plain tables as-is.
        for (const enc in data)
            if (enc[0] !== "$") utils.writeTable(enc, utils.generateTable(data[enc]));

        console.log("DBCS encodings regenerated.");
    })
);
