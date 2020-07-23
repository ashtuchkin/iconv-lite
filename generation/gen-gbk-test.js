"use strict";

const Iconv = require("iconv").Iconv,
    fs = require("fs"),
    path = require("path");

const inputFile = path.resolve(__dirname, "fixtures", "gbkFile.txt");
const contentBuffer = fs.readFileSync(inputFile);

const codec = Iconv("GBK", "utf8");
const str = codec.convert(contentBuffer).toString();

const outputFile = path.resolve(__dirname, "..", "test", "fixtures", "gbk.json");
const data = {
    bytes: [...contentBuffer],
    string: str,
};
fs.writeFileSync(outputFile, JSON.stringify(data));
