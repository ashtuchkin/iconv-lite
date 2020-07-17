"use strict";

var BOMChar = "\uFEFF";

exports.PrependBOM = class PrependBOMWrapper {
    constructor(encoder) {
        this.encoder = encoder;
        this.addBOM = true;
    }

    write(str) {
        if (this.addBOM) {
            str = BOMChar + str;
            this.addBOM = false;
        }
        return this.encoder.write(str);
    }

    end() {
        return this.encoder.end();
    }
};

exports.StripBOM = class StripBOMWrapper {
    constructor(decoder, options) {
        this.decoder = decoder;
        this.pass = false;
        this.options = options || {};
    }

    write(buf) {
        var res = this.decoder.write(buf);
        if (this.pass || !res) return res;

        if (res[0] === BOMChar) {
            res = res.slice(1);
            if (typeof this.options.stripBOM === "function") this.options.stripBOM();
        }

        this.pass = true;
        return res;
    }

    end() {
        return this.decoder.end();
    }
};
