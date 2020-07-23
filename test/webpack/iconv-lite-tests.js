"use strict";

const iconv = require("iconv-lite");
iconv.setBackend(require("iconv-lite/backends/web"));
require("../utils").setIconvLite(iconv);

// List of test files that are ready to be run in web environment.
require("../cyrillic-test");
require("../greek-test");
require("../sbcs-test");
require("../turkish-test");
require("../utf16-test");
require("../utils-test");
require("../shiftjis-test");
require("../gbk-test");
require("../big5-test");
