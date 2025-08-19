"use strict"

function mergeModules (target, module) {
  for (var key in module) {
    if (Object.prototype.hasOwnProperty.call(module, key)) {
      target[key] = module[key]
    }
  }
}

module.exports = mergeModules
