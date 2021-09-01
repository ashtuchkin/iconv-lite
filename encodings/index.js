"use strict";

// Update this array if you add/rename/remove files in this directory.
// We support Browserify by skipping automatic module discovery and requiring modules directly.
const modules = [
    require("./internal"),
    require("./utf32"),
    require("./utf16"),
    require("./utf7"),
    require("./sbcs-codec"),
    require("./sbcs-data"),
    require("./sbcs-data-generated"),
    require("./dbcs-codec"),
    require("./dbcs-data"),
];

// Put all encoding/alias/codec definitions to single object and export it.
for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    for (const enc in module)
        if (Object.prototype.hasOwnProperty.call(module, enc)) exports[enc] = module[enc];
}
