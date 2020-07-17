"use strict";

var assert = require("assert")
var utils = require("./utils")
var iconv = utils.requireIconv()

var ascii = "\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\x0c\r\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f" +
           " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7f"

var encodings = [{
  name: "windows1254",
  variations: ["windows-1254", "win-1254", "win1254", "cp1254", "cp-1254", 1254],
  strings: {
    empty: "",
    ascii: ascii,
    turkish: "€‚ƒ„…†‡ˆ‰Š‹Œ‘’“”•–—˜™š›œŸ¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏĞÑÒÓÔÕÖ×ØÙÚÛÜİŞßàáâãäåæçèéêëìíîïğñòóôõö÷øùúûüışÿ",
    untranslatable: "\x81\x8d\x8e\x8f\x90\x9d\x9e"
  },
  encodedStrings: {
    empty: utils.bytesFrom([]),
    ascii: utils.bytesFrom(ascii.split("").map(c => c.charCodeAt(0))),
    turkish: utils.bytesFrom([
      0x80, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x8b, 0x8c,
      0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9f,
      0xa1, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xab, 0xac, 0xae, 0xaf,
      0xb0, 0xb1, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xbb, 0xbc, 0xbd, 0xbe, 0xbf,
      0xc0, 0xc1, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xcb, 0xcc, 0xcd, 0xce, 0xcf,
      0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xdb, 0xdc, 0xdd, 0xde, 0xdf,
      0xe0, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xeb, 0xec, 0xed, 0xee, 0xef,
      0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff
    ])
  }
}, {
  name: "iso88599",
  variations: ["iso-8859-9", "turkish", "turkish8", "cp28599", "cp-28599", 28599],
  strings: {
    empty: "",
    ascii: ascii,
    turkish: "\xa0¡¢£¤¥¦§¨©ª«¬\xad®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏĞÑÒÓÔÕÖ×ØÙÚÛÜİŞßàáâãäåæçèéêëìíîïğñòóôõö÷øùúûüışÿ",
    untranslatable: ""
  },
  encodedStrings: {
    empty: utils.bytesFrom([]),
    ascii: utils.bytesFrom(ascii.split("").map(c => c.charCodeAt(0))),
    turkish: utils.bytesFrom([
      0xa0, 0xa1, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xab, 0xac, 0xad, 0xae, 0xaf,
      0xb0, 0xb1, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xbb, 0xbc, 0xbd, 0xbe, 0xbf,
      0xc0, 0xc1, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xcb, 0xcc, 0xcd, 0xce, 0xcf,
      0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xdb, 0xdc, 0xdd, 0xde, 0xdf,
      0xe0, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xeb, 0xec, 0xed, 0xee, 0xef,
      0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff
    ])
  }
}]

describe("Test Turkish encodings #node-web", function () {
  encodings.forEach(function (encoding) {
    var enc = encoding.variations[0]
    var key = "turkish"
    describe(encoding.name + ":", function () {
      it("Convert from buffer", function () {
        for (var key in encoding.encodedStrings)
        { assert.strictEqual(
          iconv.decode(encoding.encodedStrings[key], enc),
          encoding.strings[key]
        ) }
      })

      it("Convert to buffer", function () {
        for (var key in encoding.encodedStrings)
        { assert.strictEqual(
          utils.hex(iconv.encode(encoding.strings[key], enc)),
          utils.hex(encoding.encodedStrings[key])
        ) }
      })

      it("Try different variations of encoding", function () {
        encoding.variations.forEach(function (enc) {
          assert.strictEqual(
            iconv.decode(encoding.encodedStrings[key], enc),
            encoding.strings[key]
          )
          assert.strictEqual(
            utils.hex(iconv.encode(encoding.strings[key], enc)),
            utils.hex(encoding.encodedStrings[key])
          )
        })
      })

      it("Untranslatable chars are converted to defaultCharSingleByte", function () {
        const untranslatableBytes = utils.bytesFrom(
          encoding.strings.untranslatable.split("").map(() => iconv.defaultCharSingleByte.charCodeAt(0))
        )
        assert.strictEqual(
          utils.hex(iconv.encode(encoding.strings.untranslatable, enc)),
          utils.hex(untranslatableBytes)
        ) // Only '?' characters.
      })
    })
  })
})
