"use strict";

const iconv = require("iconv-lite")
iconv.setBackend(require("iconv-lite/backends/web"))
require("../utils").setIconvLite(iconv)

// List of test files that are ready to be run in web environment.
require("../utf16-test")
require("../cyrillic-test")
require("../greek-test")
require("../turkish-test")
