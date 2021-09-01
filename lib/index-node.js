"use strict";

const iconv = (module.exports = require("./index"));

iconv.setBackend(require("../backends/node"));
