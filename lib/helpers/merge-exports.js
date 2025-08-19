"use strict"

function mergeModules (target, module) {
  var hasOwn = Function.call.bind(Object.prototype.hasOwnProperty)
  for (var key in module) {
    if (hasOwn(module, key)) {
      target[key] = module[key]
    }
  }
}

module.exports = mergeModules
