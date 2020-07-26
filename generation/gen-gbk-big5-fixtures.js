"use strict";

const Iconv = require("iconv").Iconv,
    fs = require("fs"),
    path = require("path"),
    utils = require("../test/utils");

const fixtures = {
    big5: big5(),
    gbk: gbk(),
};
const outputFile = path.resolve(__dirname, "..", "test", "fixtures", "gbk-big5.json");
fs.writeFileSync(outputFile, JSON.stringify(fixtures));

function gbk() {
    const inputFile = path.resolve(__dirname, "fixtures", "gbkFile.txt");
    const contentBuffer = fs.readFileSync(inputFile);

    const codec = Iconv("GBK", "utf8");
    const str = codec.convert(contentBuffer).toString();

    return {
        bytes: utils.hex(contentBuffer, true),
        string: str,
    };
}

function big5() {
    const contentBuffer = Buffer.from(
        "PEhUTUw+DQo8SEVBRD4gICAgDQoJPFRJVExFPiBtZXRhILzQxdKquqjPpc6hR6SkpOW69K22IDwvVElUTEU+DQoJPG1ldGEgSFRUUC1FUVVJVj0iQ29udGVudC1UeXBlIiBDT05URU5UPSJ0ZXh0L2h0bWw7IGNoYXJzZXQ9YmlnNSI+DQo8L0hFQUQ+DQo8Qk9EWT4NCg0Ks2+sT6RArdPBY8XppKSk5br0rbahSTxicj4NCihUaGlzIHBhZ2UgdXNlcyBiaWc1IGNoYXJhY3RlciBzZXQuKTxicj4NCmNoYXJzZXQ9YmlnNQ0KDQo8L0JPRFk+DQo8L0hUTUw+",
        "base64"
    );

    const codec = Iconv("big5", "utf8");
    const str = codec.convert(contentBuffer).toString();

    return {
        bytes: utils.hex(contentBuffer, true),
        string: str,
    };
}
