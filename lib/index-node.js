"use strict";

var iconv = (module.exports = require("./index"));

iconv.setBackend(require("../backends/node"));
