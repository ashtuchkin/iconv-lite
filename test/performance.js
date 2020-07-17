/* eslint no-console: "off" */
"use strict";

if (module.parent)
    // Skip this file from testing.
    return;

var iconv = require("iconv");
var iconv_lite = require("../");

var encoding = process.argv[2] || "windows-1251";
var convertTimes = 10000;

var encodingStrings = {
    "windows-1251": "This is a test string 32 chars..",
    gbk: "这是中文字符测试。。！@￥%12",
    utf8: "这是中文字符测试。。！@￥%12This is a test string 48 chars..",
};
// Test encoding.
var str = encodingStrings[encoding];
if (!str) {
    throw new Error("Don't support " + encoding + " performance test.");
}
for (var i = 0; i < 13; i++) {
    str = str + str;
}

console.log("\n" + encoding + " charset performance test:");
console.log("\nEncoding " + str.length + " chars " + convertTimes + " times:");

let start = Date.now();
let converter = new iconv.Iconv("utf8", encoding);
let b;
for (let i = 0; i < convertTimes; i++) {
    b = converter.convert(str);
}
let duration = Date.now() - start;
let mbs = (convertTimes * b.length) / duration / 1024;

console.log("iconv: " + duration + "ms, " + mbs.toFixed(2) + " Mb/s.");

start = Date.now();
for (let i = 0; i < convertTimes; i++) {
    b = iconv_lite.encode(str, encoding);
}
duration = Date.now() - start;
mbs = (convertTimes * b.length) / duration / 1024;

console.log("iconv-lite: " + duration + "ms, " + mbs.toFixed(2) + " Mb/s.");

// Test decoding.
const buf = iconv_lite.encode(str, encoding);
console.log("\nDecoding " + buf.length + " bytes " + convertTimes + " times:");

start = Date.now();
converter = new iconv.Iconv(encoding, "utf8");
for (let i = 0; i < convertTimes; i++) {
    converter.convert(buf).toString();
}
duration = Date.now() - start;
mbs = (convertTimes * buf.length) / duration / 1024;

console.log("iconv: " + duration + "ms, " + mbs.toFixed(2) + " Mb/s.");

start = Date.now();
for (let i = 0; i < convertTimes; i++) {
    iconv_lite.decode(buf, encoding);
}
duration = Date.now() - start;
mbs = (convertTimes * buf.length) / duration / 1024;

console.log("iconv-lite: " + duration + "ms, " + mbs.toFixed(2) + " Mb/s.");
