"use strict"

function mergeModules (target, module) {
  var hasOwn = typeof Object.hasOwn === undefined? Function.call.bind(Object.prototype.hasOwnProperty) : Object.hasOwn
  for (var key in module) {
    if (hasOwn(module, key)) {
      target[key] = module[key]
    }
  }
}

module.exports = mergeModules
