const assert = require("assert")

const utils = module.exports = {
  setIconvLite (iconv) {
    utils.iconv = iconv
    utils.backend = iconv.backend
    utils.BytesType = utils.backend.bytesToResult(utils.backend.allocBytes(0), 0).constructor
  },

  requireIconv () {
    if (!utils.iconv) {
      const iconvPath = "../"  // Don't ship this module in the browser environment.
      const iconv = require(iconvPath)
      if (process.env.ICONV_BACKEND) {
        const backendPath = `../backends/${process.env.ICONV_BACKEND}`
        iconv.setBackend(require(backendPath))
      }
      utils.setIconvLite(iconv)
    }
    return utils.iconv
  },

  bytesFrom (arr) {
    const bytes = utils.backend.allocBytes(arr.length)
    bytes.set(arr)
    return utils.backend.bytesToResult(bytes, bytes.length)
  },

  concatBufs (bufs) {
    return utils.backend.concatByteResults(bufs)
  },

  hex (bytes, nonStrict) {
    assert(nonStrict || (bytes instanceof utils.BytesType))
    return bytes.reduce((output, byte) => (output + ("0" + (byte & 0xFF).toString(16)).slice(-2)), "")
  }
}
