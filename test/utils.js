"use strict";

const assert = require("assert");

const utils = (module.exports = {
    setIconvLite(iconv) {
        utils.iconv = iconv;
        utils.backend = iconv.backend;
        utils.BytesType = utils.backend.bytesToResult(utils.backend.allocBytes(0), 0).constructor;
    },

    requireIconv() {
        if (!utils.iconv) {
            const iconv_path = "../"; // Don't ship this module in the browser environment.
            const iconv = require(iconv_path);
            if (process.env.ICONV_BACKEND) {
                const backend_path = `../backends/${process.env.ICONV_BACKEND}`;
                iconv.setBackend(require(backend_path));
            }
            utils.setIconvLite(iconv);
        }
        return utils.iconv;
    },

    // Returns backend 'bytes' types from an array of ints or a hex string.
    bytes(arr) {
        if (typeof arr === "string") {
            // Hex string - convert to array
            const str = arr.replace(/[\s_:.]/g, ""); // Remove potential separators
            assert(str.length % 2 === 0);
            arr = [];
            for (let i = 0; i < str.length - 1; i += 2) {
                arr.push(parseInt(str.slice(i, i + 2), 16));
            }
        }

        const bytes = utils.backend.allocBytes(arr.length);
        bytes.set(arr);
        return utils.backend.bytesToResult(bytes, bytes.length);
    },

    concatBufs(bufs) {
        return utils.backend.concatByteResults(bufs);
    },

    hex(bytes, nonStrict) {
        assert(nonStrict || bytes instanceof utils.BytesType);
        return Array.prototype.map
            .call(bytes, (byte) => ("0" + (byte & 0xff).toString(16)).slice(-2))
            .join(" ");
    },

    checkDecoderChunks(encoding, cases) {
        return () => {
            const decoder = utils.iconv.getDecoder(encoding);
            if (!Array.isArray(cases)) {
                cases = [cases];
            }

            for (let idx = 0; idx < cases.length; idx++) {
                const inputs = cases[idx].inputs,
                    outputs = cases[idx].outputs;
                for (let i = 0; i < inputs.length; i++)
                    assert.strictEqual(
                        decoder.write(utils.bytes(inputs[i])),
                        outputs[i],
                        `position ${i} in case ${idx}`
                    );

                if (outputs.length === inputs.length) {
                    assert(!decoder.end(), `end is not empty in case ${idx}`);
                } else if (outputs.length === inputs.length + 1) {
                    assert.strictEqual(
                        decoder.end(),
                        outputs[outputs.length - 1],
                        `end result unexpected in case ${idx}`
                    );
                } else {
                    assert(false, `invalid outputs array size in case ${idx}`);
                }
            }
        };
    },
});
