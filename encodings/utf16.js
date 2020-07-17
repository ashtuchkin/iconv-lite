"use strict";

// == UTF16-LE codec. ==========================================================
// Note: We're not using Node.js native codec because StringDecoder implementation is buggy
// (adds \0 in some chunks; doesn't flag non-even number of bytes). We do use raw encoding/decoding
// routines for performance where possible, though.

exports.utf16le = class Utf16LECodec {
    createEncoder(options, iconv) {
        return new Utf16LEEncoder(iconv.backend);
    }
    createDecoder(options, iconv) {
        return new Utf16LEDecoder(iconv.backend, iconv.defaultCharUnicode);
    }
    get bomAware() {
        return true;
    }
};

class Utf16LEEncoder {
    constructor(backend) {
        this.backend = backend;
    }

    write(str) {
        const bytes = this.backend.allocBytes(str.length * 2);
        const chars = new Uint16Array(bytes.buffer, bytes.byteOffset, str.length);
        for (let i = 0; i < str.length; i++) {
            chars[i] = str.charCodeAt(i);
        }
        return this.backend.bytesToResult(bytes, bytes.length);
    }

    end() {}
}

class Utf16LEDecoder {
    constructor(backend, defaultChar) {
        this.backend = backend;
        this.defaultChar = defaultChar;
        this.leadByte = -1;
        this.leadSurrogate = undefined;
    }

    write(buf) {
        // NOTE: This function is mostly the same as Utf16BEDecoder.write() with bytes swapped.
        //   Please keep them in sync.
        // NOTE: The logic here is more complicated than barely necessary due to several limitations:
        //  1. Input data chunks can split 2-byte code units, making 'leadByte' necessary.
        //  2. Input data chunks can split valid surrogate pairs, making 'leadSurrogate' necessary.
        //  3. rawCharsToResult() of Web backend converts all lone surrogates to '�', so we need to make
        //     sure we don't feed it parts of valid surrogate pairs.
        //  4. For performance reasons we want to use initial buffer as much as we can. This is not
        //     possible if after our calculations the 2-byte memory alignment of a Uint16Array is lost,
        //     in which case we have to do a copy.

        if (buf.length === 0) {
            return "";
        }
        let offset = 0;
        let byteLen = buf.length;

        // Process previous leadByte
        let prefix = "";
        if (this.leadByte !== -1) {
            offset++;
            byteLen--;
            prefix = String.fromCharCode(this.leadByte | (buf[0] << 8));
        }

        // Set new leadByte if needed
        if (byteLen & 1) {
            this.leadByte = buf[buf.length - 1];
            byteLen--;
        } else {
            this.leadByte = -1;
        }

        // Process leadSurrogate
        if (prefix.length || byteLen) {
            // Add high surrogate from previous chunk.
            if (this.leadSurrogate) {
                if (prefix.length) {
                    prefix = this.leadSurrogate + prefix;
                } else {
                    // Make sure 'chars' don't start with a lone low surrogate; it will mess with rawCharsToResult.
                    const lastChar = String.fromCharCode(buf[offset] | (buf[offset + 1] << 8));
                    prefix = this.leadSurrogate + lastChar;
                    offset += 2;
                    byteLen -= 2;
                }
                this.leadSurrogate = undefined;
            }

            // Slice off a new high surrogate at the end of the current chunk.
            if (byteLen) {
                const lastIdx = offset + byteLen - 2;
                const lastChar = buf[lastIdx] | (buf[lastIdx + 1] << 8);
                if (0xd800 <= lastChar && lastChar < 0xdc00) {
                    this.leadSurrogate = String.fromCharCode(lastChar);
                    byteLen -= 2;
                }
            } else {
                // slice from prefix
                const lastChar = prefix.charCodeAt(prefix.length - 1);
                if (0xd800 <= lastChar && lastChar < 0xdc00) {
                    this.leadSurrogate = prefix[prefix.length - 1];
                    prefix = prefix.slice(0, -1);
                }
            }
        }

        let chars;
        if (((buf.byteOffset + offset) & 1) === 0) {
            // If byteOffset is aligned, just use the ArrayBuffer from input buf.
            chars = new Uint16Array(buf.buffer, buf.byteOffset + offset, byteLen >> 1);
        } else {
            // If byteOffset is NOT aligned, create a new aligned buffer and copy the data.
            chars = this.backend.allocRawChars(byteLen >> 1);
            const srcByteView = new Uint8Array(buf.buffer, buf.byteOffset + offset, byteLen);
            const destByteView = new Uint8Array(chars.buffer, chars.byteOffset, byteLen);
            destByteView.set(srcByteView);
        }

        return prefix + this.backend.rawCharsToResult(chars, chars.length);
    }

    end() {
        let res;
        if (this.leadSurrogate || this.leadByte !== -1) {
            res =
                (this.leadSurrogate ? this.leadSurrogate : "") +
                (this.leadByte !== -1 ? this.defaultChar : "");
            this.leadSurrogate = undefined;
            this.leadByte = -1;
        }
        return res;
    }
}
exports.ucs2 = "utf16le"; // Alias

// == UTF16-BE codec. ==========================================================

exports.utf16be = class Utf16BECodec {
    createEncoder(options, iconv) {
        return new Utf16BEEncoder(iconv.backend);
    }
    createDecoder(options, iconv) {
        return new Utf16BEDecoder(iconv.backend, iconv.defaultCharUnicode);
    }
    get bomAware() {
        return true;
    }
};

class Utf16BEEncoder {
    constructor(backend) {
        this.backend = backend;
    }

    write(str) {
        const bytes = this.backend.allocBytes(str.length * 2);
        let bytesPos = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            bytes[bytesPos++] = char >> 8;
            bytes[bytesPos++] = char & 0xff;
        }
        return this.backend.bytesToResult(bytes, bytesPos);
    }

    end() {}
}

class Utf16BEDecoder {
    constructor(backend, defaultChar) {
        this.backend = backend;
        this.defaultChar = defaultChar;
        this.leadByte = -1;
        this.leadSurrogate = undefined;
    }

    write(buf) {
        // NOTE: This function is mostly copy/paste from Utf16LEDecoder.write() with bytes swapped.
        // Please keep them in sync. Comments in that function apply here too.
        if (buf.length === 0) {
            return "";
        }

        let offset = 0;
        let byteLen = buf.length;

        // Process previous leadByte
        let prefix = "";
        if (this.leadByte !== -1) {
            offset++;
            byteLen--;
            prefix = String.fromCharCode((this.leadByte << 8) | buf[0]);
        }

        // Set new leadByte
        if (byteLen & 1) {
            this.leadByte = buf[buf.length - 1];
            byteLen--;
        } else {
            this.leadByte = -1;
        }

        // Process leadSurrogate
        if (prefix.length || byteLen) {
            // Add high surrogate from previous chunk.
            if (this.leadSurrogate) {
                if (prefix.length) {
                    prefix = this.leadSurrogate + prefix;
                } else {
                    // Make sure 'chars' don't start with a lone low surrogate; it will mess with rawCharsToResult.
                    const lastChar = String.fromCharCode((buf[offset] << 8) | buf[offset + 1]);
                    prefix = this.leadSurrogate + lastChar;
                    offset += 2;
                    byteLen -= 2;
                }
                this.leadSurrogate = undefined;
            }

            // Slice off a new high surrogate at the end of the current chunk.
            if (byteLen) {
                const lastIdx = offset + byteLen - 2;
                const lastChar = (buf[lastIdx] << 8) | buf[lastIdx + 1];
                if (0xd800 <= lastChar && lastChar < 0xdc00) {
                    this.leadSurrogate = String.fromCharCode(lastChar);
                    byteLen -= 2;
                }
            } else {
                // slice from prefix
                const lastChar = prefix.charCodeAt(prefix.length - 1);
                if (0xd800 <= lastChar && lastChar < 0xdc00) {
                    this.leadSurrogate = prefix[prefix.length - 1];
                    prefix = prefix.slice(0, -1);
                }
            }
        }

        // Convert the main chunk of bytes
        const chars = this.backend.allocRawChars(byteLen >> 1);
        const srcBytes = new DataView(buf.buffer, buf.byteOffset + offset, byteLen);
        for (let i = 0; i < chars.length; i++) {
            chars[i] = srcBytes.getUint16(i * 2);
        }

        return prefix + this.backend.rawCharsToResult(chars, chars.length);
    }

    end() {
        let res;
        if (this.leadSurrogate || this.leadByte !== -1) {
            res =
                (this.leadSurrogate ? this.leadSurrogate : "") +
                (this.leadByte !== -1 ? this.defaultChar : "");
            this.leadSurrogate = undefined;
            this.leadByte = -1;
        }
        return res;
    }
}

// == UTF-16 codec =============================================================
// Decoder chooses automatically from UTF-16LE and UTF-16BE using BOM and space-based heuristic.
// Defaults to UTF-16LE, as it's prevalent and default in Node.
// http://en.wikipedia.org/wiki/UTF-16 and http://encoding.spec.whatwg.org/#utf-16le
// Decoder default can be changed: iconv.decode(buf, 'utf16', {defaultEncoding: 'utf-16be'});

// Encoder uses UTF-16LE and prepends BOM (which can be overridden with addBOM: false).

exports.utf16 = class Utf16Codec {
    createEncoder(options, iconv) {
        options = options || {};
        if (options.addBOM === undefined) options.addBOM = true;
        return iconv.getEncoder("utf-16le", options);
    }
    createDecoder(options, iconv) {
        return new Utf16Decoder(options, iconv);
    }
};

class Utf16Decoder {
    constructor(options, iconv) {
        this.decoder = null;
        this.initialBufs = [];
        this.initialBufsLen = 0;

        this.options = options || {};
        this.iconv = iconv;
    }

    write(buf) {
        if (!this.decoder) {
            // Codec is not chosen yet. Accumulate initial bytes.
            this.initialBufs.push(buf);
            this.initialBufsLen += buf.length;

            if (this.initialBufsLen < 16)
                // We need more bytes to use space heuristic (see below)
                return "";

            // We have enough bytes -> detect endianness.
            return this._detectEndiannessAndSetDecoder();
        }

        return this.decoder.write(buf);
    }

    end() {
        if (!this.decoder) {
            return this._detectEndiannessAndSetDecoder() + (this.decoder.end() || "");
        }
        return this.decoder.end();
    }

    _detectEndiannessAndSetDecoder() {
        const encoding = detectEncoding(this.initialBufs, this.options.defaultEncoding);
        this.decoder = this.iconv.getDecoder(encoding, this.options);

        const resStr = this.initialBufs.reduce((a, b) => a + this.decoder.write(b), "");
        this.initialBufs.length = this.initialBufsLen = 0;
        return resStr;
    }
}

function detectEncoding(bufs, defaultEncoding) {
    const b = [];
    let charsProcessed = 0;
    let asciiCharsLE = 0,
        asciiCharsBE = 0; // Number of ASCII chars when decoded as LE or BE.

    outer_loop: for (let i = 0; i < bufs.length; i++) {
        const buf = bufs[i];
        for (let j = 0; j < buf.length; j++) {
            b.push(buf[j]);
            if (b.length === 2) {
                if (charsProcessed === 0) {
                    // Check BOM first.
                    if (b[0] === 0xff && b[1] === 0xfe) return "utf-16le";
                    if (b[0] === 0xfe && b[1] === 0xff) return "utf-16be";
                }

                if (b[0] === 0 && b[1] !== 0) asciiCharsBE++;
                if (b[0] !== 0 && b[1] === 0) asciiCharsLE++;

                b.length = 0;
                charsProcessed++;

                if (charsProcessed >= 100) {
                    break outer_loop;
                }
            }
        }
    }

    // Make decisions.
    // Most of the time, the content has ASCII chars (U+00**), but the opposite (U+**00) is uncommon.
    // So, we count ASCII as if it was LE or BE, and decide from that.
    if (asciiCharsBE > asciiCharsLE) return "utf-16be";
    if (asciiCharsBE < asciiCharsLE) return "utf-16le";

    // Couldn't decide (likely all zeros or not enough data).
    return defaultEncoding || "utf-16le";
}
