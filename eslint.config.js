"use strict"
const neostandard = require("neostandard")

module.exports = [
  ...neostandard({
    env: ["mocha"],
    ignores: [
      "encodings/sbcs-data-generated.js", // This a generate file
      // We need work on this
      "generation"
    ]
  }),
  {
    rules: {
      "@stylistic/quotes": [2, "double"],
      "new-cap": ["off"], // We need improve this
      "no-labels": ["off"], // Can remove the labels?
      eqeqeq: ["off"], // We need investigate why some conditions are not using strict equality
      "@stylistic/brace-style": ["off"], // Because this rules is flaky?
      "no-var": ["off"], // Compatibility with older code
      "no-redeclare": ["off"], // Because we use var for compatibility with node 0.10
      "comma-dangle": ["error", "never"]
    }
  }
]
