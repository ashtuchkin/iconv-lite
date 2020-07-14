"use strict"

// Note: UTF16-LE (or UCS2) codec is Node.js native. See encodings/internal.js

// == UTF16-BE codec. ==========================================================

exports.utf16be = class Utf16BECodec {
  get encoder () { return Utf16BEEncoder }
  get decoder () { return Utf16BEDecoder }
  get bomAware () { return true }
}

class Utf16BEEncoder {
  constructor (opts, codec, backend) {
    this.backend = backend
  }

  write (str) {
    const bytes = this.backend.allocBytes(str.length * 2)
    let bytesPos = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      bytes[bytesPos++] = char >> 8
      bytes[bytesPos++] = char & 0xff
    }
    return this.backend.bytesToResult(bytes, bytesPos)
  }

  end () {}
}

class Utf16BEDecoder {
  constructor (opts, codec, backend) {
    this.backend = backend
    this.overflowByte = -1
  }

  write (buf) {
    const chars = this.backend.allocRawChars((buf.length + 1) >> 1)
    let charsPos = 0; let i = 0

    if (this.overflowByte !== -1 && i < buf.length) {
      chars[charsPos++] = (this.overflowByte << 8) + buf[i++]
    }

    for (; i < buf.length - 1; i += 2) {
      chars[charsPos++] = (buf[i] << 8) + buf[i + 1]
    }

    this.overflowByte = (i == buf.length - 1) ? buf[i] : -1

    return this.backend.rawCharsToResult(chars, charsPos)
  }

  end () {
    this.overflowByte = -1
  }
}

// == UTF-16 codec =============================================================
// Decoder chooses automatically from UTF-16LE and UTF-16BE using BOM and space-based heuristic.
// Defaults to UTF-16LE, as it's prevalent and default in Node.
// http://en.wikipedia.org/wiki/UTF-16 and http://encoding.spec.whatwg.org/#utf-16le
// Decoder default can be changed: iconv.decode(buf, 'utf16', {defaultEncoding: 'utf-16be'});

// Encoder uses UTF-16LE and prepends BOM (which can be overridden with addBOM: false).

exports.utf16 = class Utf16Codec {
  constructor (opts, iconv) {
    this.iconv = iconv
  }

  get encoder () { return Utf16Encoder }
  get decoder () { return Utf16Decoder }
}

class Utf16Encoder {
  constructor (options, codec) {
    options = options || {}
    if (options.addBOM === undefined) { options.addBOM = true }
    this.encoder = codec.iconv.getEncoder(options.use || "utf-16le", options)
  }

  // Pass-through to this.encoder
  write (str) {
    return this.encoder.write(str)
  }

  end () {
    return this.encoder.end()
  }
}

class Utf16Decoder {
  constructor (options, codec) {
    this.decoder = null
    this.initialBufs = []
    this.initialBufsLen = 0

    this.options = options || {}
    this.iconv = codec.iconv
  }

  write (buf) {
    if (!this.decoder) {
      // Codec is not chosen yet. Accumulate initial bytes.
      this.initialBufs.push(buf)
      this.initialBufsLen += buf.length

      // We need more bytes to use space heuristic (see below)
      if (this.initialBufsLen < 16) { return "" }

      // We have enough bytes -> detect endianness.
      return this._detectEndiannessAndSetDecoder()
    }

    return this.decoder.write(buf)
  }

  end () {
    if (!this.decoder) {
      return this._detectEndiannessAndSetDecoder() + (this.decoder.end() || "")
    }
    return this.decoder.end()
  }

  _detectEndiannessAndSetDecoder () {
    const encoding = detectEncoding(this.initialBufs, this.options.defaultEncoding)
    this.decoder = this.iconv.getDecoder(encoding, this.options)

    const resStr = this.initialBufs.reduce((a, b) => a + this.decoder.write(b), "")
    this.initialBufs.length = this.initialBufsLen = 0
    return resStr
  }
}

function detectEncoding (bufs, defaultEncoding) {
  const b = []
  let charsProcessed = 0
  let asciiCharsLE = 0; let asciiCharsBE = 0 // Number of ASCII chars when decoded as LE or BE.

  outerLoop:
  for (let i = 0; i < bufs.length; i++) {
    const buf = bufs[i]
    for (let j = 0; j < buf.length; j++) {
      b.push(buf[j])
      if (b.length === 2) {
        if (charsProcessed === 0) {
          // Check BOM first.
          if (b[0] === 0xFF && b[1] === 0xFE) return "utf-16le"
          if (b[0] === 0xFE && b[1] === 0xFF) return "utf-16be"
        }

        if (b[0] === 0 && b[1] !== 0) asciiCharsBE++
        if (b[0] !== 0 && b[1] === 0) asciiCharsLE++

        b.length = 0
        charsProcessed++

        if (charsProcessed >= 100) {
          break outerLoop
        }
      }
    }
  }

  // Make decisions.
  // Most of the time, the content has ASCII chars (U+00**), but the opposite (U+**00) is uncommon.
  // So, we count ASCII as if it was LE or BE, and decide from that.
  if (asciiCharsBE > asciiCharsLE) return "utf-16be"
  if (asciiCharsBE < asciiCharsLE) return "utf-16le"

  // Couldn't decide (likely all zeros or not enough data).
  return defaultEncoding || "utf-16le"
}
