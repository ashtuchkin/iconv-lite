var fs      = require('fs'),
    assert  = require('assert'),
    iconv   = require(__dirname+'/../'),
    Iconv   = require('iconv').Iconv;


// Make all valid input combinations for a given encoding and call fn with it.
// fn(valid, input, output)
function forAllChars(converter, fn, origbuf, len) {
    if (!origbuf) {
        origbuf = new Buffer(10);
        len = 1;
    }
    var buf = origbuf.slice(0, len);
    for (var i = 0; i < 0x100; i++) {
        buf[len-1] = i;
        try {
            var res = converter(buf);
            
            // buf contains correct input combination. Run fn with input and converter output.
            fn(true, buf, res);

        } catch (e) {
            if (e.code == "EILSEQ") { // Invalid character sequence.
                // Notify that this sequence is invalid.
                fn(false, buf);
            }
            else if (e.code == "EINVAL") { // Partial character sequence.
                // Recurse deeper.
                forAllChars(converter, fn, origbuf, len+1);
            }
            else
                throw e;
        }
    }
}

function convertWithDefault(converter, buf) {
    try {
        return converter.convert(buf);
    } catch (e) {
        if (e.code != "EILSEQ")
            throw e;
    }
    return new Buffer(iconv.defaultCharSingleByte);
}

var aliases = {
    shiftjis: 'shift-jis',
    big5hkscs: 'big5-hkscs',
};
var iconvChanges = { // Characters that iconv changing (iconv char -> our char)
    // cp932 is changed in iconv (see comments in cp932.h)
    cp932: {"〜":"～","‖":"∥","−":"－","¢":"￠","£":"￡","¬":"￢"},
    cp950: {"¥":"￥"},
    shiftjis: {"＼":"\\"}, // iconv has changed mapping of 5c (reverse solidus) to ff3c (full width reverse solidus)

    // Big5 is known for lots of different variations. We use Encoding Standard.
    big5hkscs: {"•": "‧", "､": "﹑", "‾": "¯", "∼": "～", "♁": "⊕", "☉": "⊙", "／": "∕", "＼": "﹨", "¥": "￥", "¢": "￠", "£": "￡"},
}

var iconvCannotDecode = { // Characters that we can decode, but iconv cannot. Encoding -> correct char. Also use them for encoding check.
    shiftjis: { "815f": "\\" },
    big5hkscs: {
        "8e69": "箸", "8e6f": "簆", "8e7e": "糎", "8eab": "緒", "8eb4": "縝", "8ecd": "者", "8ed0": "耨", "8f57": "菁",
        "8f69": "蒨", "8f6e": "萏", "8fcb": "覦", "8fcc": "覩", "8ffe": "起", "906d": "都", "907a": "銹", "90dc": "靜",
        "90f1": "響", "91bf": "鼖", "9244": "蔃", "92af": "兙", "92b0": "兛", "92b1": "兝", "92b2": "兞", "92c8": "鍮",
        "92d1": "瑹", "9447": "浧", "94ca": "禛", "95d9": "邗", "9644": "靝", "96ed": "瀞", "96fc": "嬨", "9b76": "爁",
        "9b78": "矗", "9b7b": "纇", "9bc6": "駖", "9bde": "釔", "9bec": "惞", "9bf6": "澶", "9c42": "輶", "9c53": "侻",
        "9c62": "營", "9c68": "鄄", "9c6b": "鷰", "9c77": "菏", "9cbc": "尐", "9cbd": "秣", "9cd0": "婧", "9d57": "輋",
        "9d5a": "筑", "9dc4": "拐", "9ea9": "恢", "9eef": "痹", "9efd": "汊", "9f60": "鬮", "9f66": "鼗", "9fcb": "僭",
        "9fd8": "弌", "a063": "蠏", "a077": "拎", "a0d5": "瑨", "a0df": "煢", "a0e4": "牐",

        "a145": "‧", "a14e": "﹑", "a15a": "╴", "a1c2": "¯", "a1c3": "￣", "a1c5": "ˍ", "a1e3": "～", "a1f2": "⊕", "a1f3": "⊙",
        "a1fe": "／", "a240": "＼", "a241": "∕", "a242": "﹨", "a244": "￥", "a246": "￠", "a247": "￡", "a2cc": "十", "a2ce": "卅",
        "a3c0": "␀", "a3c1": "␁", "a3c2": "␂", "a3c3": "␃", "a3c4": "␄", "a3c5": "␅", "a3c6": "␆", "a3c7": "␇",
        "a3c8": "␈", "a3c9": "␉", "a3ca": "␊", "a3cb": "␋", "a3cc": "␌", "a3cd": "␍", "a3ce": "␎", "a3cf": "␏",
        "a3d0": "␐", "a3d1": "␑", "a3d2": "␒", "a3d3": "␓", "a3d4": "␔", "a3d5": "␕", "a3d6": "␖", "a3d7": "␗",
        "a3d8": "␘", "a3d9": "␙", "a3da": "␚", "a3db": "␛", "a3dc": "␜", "a3dd": "␝", "a3de": "␞", "a3df": "␟",
        "a3e0": "␡", "a3e1": "€", 

        "c6cf": "廴", "c6d3": "无", "c6d5": "癶", "c6d7": "隶", "c6de": "〃", "c6df": "仝", 
        "fa5f": "倩", "fa66": "偽", 
        "fabd": "包", "fac5": "卄", "fad5": "卿", "fb48": "嘅", "fbb8": "婷", "fbf3": "幵", "fbf9": "廐", "fc4f": "彘", 
        "fc6c": "悤", "fcb9": "撐", "fce2": "晴", "fcf1": "杞", "fdb7": "沜", "fdb8": "渝", "fdbb": "港", "fdf1": "煮", 
        "fe52": "猪", "fe6f": "瑜", "feaa": "瓩", "fedd": "砉",
    },
    gbk: { "80": "€", "a2e3": "€", "a8bf": "ǹ", 
        "a98a": "⿰", "a98b": "⿱", "a98c": "⿲", "a98d": "⿳", "a98e": "⿴", "a98f": "⿵", "a990": "⿶", 
        "a991": "⿷", "a992": "⿸", "a993": "⿹", "a994": "⿺", "a995": "⿻", "a989": "〾",
        "fe50": "⺁", "fe54": "⺄", "fe55": "㑳", "fe56": "㑇", "fe57": "⺈", "fe58": "⺋", "fe5a": "㖞", 
        "fe5b": "㘚", "fe5c": "㘎",  "fe5d": "⺌", "fe5e": "⺗", "fe5f": "㥮",
        "fe60": "㤘", "fe62": "㧏", "fe63": "㧟", "fe64": "㩳", "fe65": "㧐", "fe68": "㭎", "fe69": "㱮",
        "fe6a": "㳠", "fe6b": "⺧", "fe6e": "⺪",  "fe6f": "䁖",
        "fe70": "䅟", "fe71": "⺮", "fe72": "䌷", "fe73": "⺳", "fe74": "⺶", "fe75": "⺷", "fe77": "䎱",
        "fe78": "䎬", "fe79": "⺻", "fe7a": "䏝", "fe7b": "䓖", "fe7c": "䙡", "fe7d": "䙌",
        "fe80": "䜣", "fe81": "䜩", "fe82": "䝼", "fe83": "䞍", "fe84": "⻊", "fe85": "䥇", "fe86": "䥺", "fe87": "䥽", 
        "fe88": "䦂", "fe89": "䦃", "fe8a": "䦅", "fe8b": "䦆", "fe8c": "䦟", "fe8d": "䦛", "fe8e": "䦷", "fe8f": "䦶",
        "fe92": "䲣", "fe93": "䲟", "fe94": "䲠", "fe95": "䲡", "fe96": "䱷", "fe97": "䲢", 
        "fe98": "䴓", "fe99": "䴔", "fe9a": "䴕", "fe9b": "䴖", "fe9c": "䴗", "fe9d": "䴘", "fe9e": "䴙", "fe9f": "䶮",
    },
}

function swapBytes(buf) { for (var i = 0; i < buf.length; i+=2) buf.writeUInt16LE(buf.readUInt16BE(i), i); return buf; }
function spacify2(str) { return str.replace(/(..)/g, "$1 ").trim(); }
function spacify4(str) { return str.replace(/(....)/g, "$1 ").trim(); }
function strToHex(str) { return spacify4(swapBytes(new Buffer(str, 'ucs2')).toString('hex')); }

// Generate tests for all DBCS encodings.
iconv.encode('', 'utf8'); // Load all encodings.

describe("Full DBCS encoding tests", function() {
    this.timeout(5000); // These tests are pretty slow.

    for (var enc in iconv.encodings) {
        if (iconv.encodings[enc].type === '_dbcs') (function(enc) {
            // Create tests for this encoding.
            it("Decode DBCS encoding '" + enc + "'", function() {
                var iconvChgs = iconvChanges[enc] || {};
                var iconvCannotDecodeChars = iconvCannotDecode[enc] || {};
                var converter = new Iconv(aliases[enc] || enc, "utf-8");
                var errors = [];
                forAllChars(converter.convert.bind(converter), function(valid, inp, outp) {
                    var strActual = iconv.decode(inp, enc);

                    if (0xE000 <= strActual.charCodeAt(0) && strActual.charCodeAt(0) < 0xF900)  // Skip Private use area.
                        return;

                    if (valid) {
                        var strExpected = outp.toString('utf-8');
                        if (strActual === strExpected)
                            return;

                        if (0xE000 <= strExpected.charCodeAt(0) && strExpected.charCodeAt(0) < 0xF900)  // Skip Private use area.
                            return;

                        if (iconvChgs[strExpected] === strActual)  // Skip iconv changes.
                            return;

                    } else {
                        var strExpected = "�";
                        if (strActual[0] === "�")
                            return;

                        if (iconvCannotDecodeChars[inp.toString('hex')] === strActual)  // Skip what iconv cannot encode.
                            return;
                    }

                    errors.push({ input: inp.toString('hex'), strExpected: strExpected, strActual: strActual });
                });

                if (errors.length > 0)
                    assert.fail(null, null, "Decoding mismatch: <input> | <expected> | <actual> | <expected char> | <actual char>\n"
                        + errors.map(function(err) {
                        return "          " + spacify2(err.input) + " | " + strToHex(err.strExpected) + " | " + strToHex(err.strActual) + " | " + 
                            err.strExpected + " | " + err.strActual;
                    }).join("\n") + "\n       ");
            });

            it("Encode DBCS encoding '" + enc + "'", function() {
                var iconvChgs = iconvChanges[enc] || {};
                var iconvCannotDecodeChars = iconvCannotDecode[enc] || {};
                var converter = new Iconv("utf-8", aliases[enc] || enc);
                var converterBack = new Iconv(aliases[enc] || enc, "utf-8");
                var errors = [];
                for (var i = 0; i < 0x10000; i++) {
                    if (i == 0xD800) i = 0xF900; // Skip surrogates & private use.

                    var str = String.fromCharCode(i);

                    var bufExpected = convertWithDefault(converter, str);
                    var strExpected = bufExpected.toString('hex');
                    
                    var bufActual = iconv.encode(str, enc)
                    var strActual = bufActual.toString('hex');

                    if (strExpected == strActual)
                        continue;

                    if (strExpected == '3f' && iconvCannotDecodeChars[strActual] == str)
                        continue; // Check the iconv cannot encode this char, but we encoded correctly.
                    
                    var str1 = iconv.decode(bufExpected, enc);
                    var str12 = iconv.decode(bufActual, enc);
                    var str2 = convertWithDefault(converterBack, bufActual).toString();
                    var str22 = convertWithDefault(converterBack, bufExpected).toString();
                    if (str1 == str && str12 == str && str22 == str && 
                            (str2 == str || (str2 == '?' && iconvCannotDecodeChars[strActual] == str)))
                        continue; // There are multiple ways to encode str, so it doesn't matter which we choose.

                    if (iconvChgs[str] == str1)
                        continue; // Skip iconv changes.

                    errors.push({input: strToHex(str), inputChar: str, strExpected: strExpected, strActual: strActual});
                }

                if (errors.length > 0)
                    assert.fail(null, null, "Encoding mismatch: <input> | <input char> | <expected> | <actual>\n"
                        + errors.map(function(err) {
                        return "          " + err.input + " | " + err.inputChar + " | " + spacify2(err.strExpected) + " | " + spacify2(err.strActual);
                    }).join("\n") + "\n       ");
            });
        })(enc);
    }
});

