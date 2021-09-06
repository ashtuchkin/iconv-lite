"use strict";

// Update this array if you add/rename/remove files in this directory.
// We support Browserify by skipping automatic module discovery and requiring modules directly.

const encodingList = {}
await Promise.all([
  import("./internal.js"),
  import("./utf32.js"),
  import("./utf16.js"),
  import("./utf7.js"),
  import("./sbcs-codec.js"),
  import("./sbcs-data.js"),
  import("./sbcs-data-generated.js"),
  import("./dbcs-codec.js"),
  import("./dbcs-data.js")
])
  .then(res => {
// Put all encoding/alias/codec definitions to single object and export it.
    for (var i = 0; i < res.length; i++) {
      var module = res[i].default;
      for (var enc in module) {
        if (Object.prototype.hasOwnProperty.call(module, enc)) {
          encodingList[enc] = module[enc];
        }
      }
    }
  });

export default encodingList
