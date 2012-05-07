
var iconv = require('iconv');
var iconv_lite = require("../index");

var encoding = "windows-1251";
var convertTimes = 1000;

// Test encoding.
var str = "This is a test string 32 chars..";
for (var i = 0; i < 13; i++)
    str = str + str;

console.log("\nEncoding "+str.length+" chars "+convertTimes+" times:");

var start = Date.now();
var converter = new iconv.Iconv("utf8", encoding);
for (var i = 0; i < convertTimes; i++) {
    var b = converter.convert(str);
}
var duration = Date.now() - start;
var mbs = convertTimes*str.length/duration/1024;

console.log("iconv: "+duration+"ms, "+mbs.toFixed(2)+" Mb/s.");

var start = Date.now();
for (var i = 0; i < convertTimes; i++) {
    var b = iconv_lite.encode(str, encoding);
}
var duration = Date.now() - start;
var mbs = convertTimes*str.length/duration/1024;

console.log("iconv-lite: "+duration+"ms, "+mbs.toFixed(2)+" Mb/s.");


// Test decoding.
var buf = iconv_lite.encode(str, encoding);
console.log("\nDecoding "+buf.length+" bytes "+convertTimes+" times:");

var start = Date.now();
var converter = new iconv.Iconv(encoding, "utf8");
for (var i = 0; i < convertTimes; i++) {
    var s = converter.convert(buf).toString();
}
var duration = Date.now() - start;
var mbs = convertTimes*buf.length/duration/1024;

console.log("iconv: "+duration+"ms, "+mbs.toFixed(2)+" Mb/s.");

var start = Date.now();
for (var i = 0; i < convertTimes; i++) {
    var s = iconv_lite.decode(buf, encoding);
}
var duration = Date.now() - start;
var mbs = convertTimes*buf.length/duration/1024;

console.log("iconv-lite: "+duration+"ms, "+mbs.toFixed(2)+" Mb/s.");

