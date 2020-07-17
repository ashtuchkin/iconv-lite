"use strict";
// NOTE: This backend uses TextDecoder class.
// NOTE: Web backend differs from Node in handling invalid surrogates when decoding to strings in rawCharsToResult() function.
//   Node passes them through unchanged, web backend (actually TextDecoder) replaces them with '�'. I haven't found a
//   performant way to unify these behaviors while keeping compatibility with Node <11 where there's no TextDecoder.
//   Not too worried as it seems like an edge case mostly concerning utf-16/utf-32/cesu8 codecs, but something to be aware of.

module.exports = {
    // Encoder string input: use str directly, .length, .charCodeAt(i).
    // Encoder bytes output: allocBytes() -> use Uint8Array -> bytesToResult().
    allocBytes(numBytes, fill) {
        const arr = new Uint8Array(new ArrayBuffer(numBytes));
        if (fill != null) {
            arr.fill(fill);
        }
        return arr;
    },
    bytesToResult(bytes, finalLen) {
        return bytes.subarray(0, finalLen);
    },
    concatByteResults(bufs) {
        bufs = bufs.filter((b) => b.length > 0);
        if (bufs.length === 0) {
            return new Uint8Array();
        } else if (bufs.length === 1) {
            return bufs[0];
        }

        const totalLen = bufs.reduce((a, b) => a + b.length, 0);
        const res = new Uint8Array(new ArrayBuffer(totalLen));
        let curPos = 0;
        for (var i = 0; i < bufs.length; i++) {
            res.set(bufs[i], curPos);
            curPos += bufs[i].length;
        }
        return res;
    },

    // Decoder bytes input: use only array access + .length, so both Buffer-s and Uint8Array-s work.
    // Decoder string output: allocRawChars -> use Uint16Array -> rawCharsToResult().
    allocRawChars(numChars) {
        return new Uint16Array(new ArrayBuffer(numChars * Uint16Array.BYTES_PER_ELEMENT));
    },
    rawCharsToResult(rawChars, finalLen) {
        rawChars = rawChars.subarray(0, finalLen);
        // NOTE: TextDecoder will convert all invalid surrogates to '�'-s.
        const res = new TextDecoder("utf-16", { ignoreBOM: true }).decode(rawChars);
        if (res.length !== finalLen)
            throw new Error(`TextDecoder returned different length string on array ${rawChars}`);
        return res;
    },

    // Optimizations
    // maybe buf.swap16()?
};
