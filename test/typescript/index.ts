//const {encode, decode} = require("iconv-lite");
//import iconv = require("iconv-lite");
import * as iconv from "iconv-lite";

const buf = Buffer.from("abc");

const str = iconv.decode(buf, "utf8", {stripBOM: () => {}});

const str2 = str.toLowerCase();

const buf2 = iconv.encode(str2, "utf8");

const byte: number = buf2.readInt8(0);


const codec = iconv.getCodec("utf8");
const encoder = new codec.encoder({}, codec);
encoder.write("abc");
