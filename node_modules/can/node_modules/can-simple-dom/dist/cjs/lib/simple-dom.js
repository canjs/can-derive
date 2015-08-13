/*lib/simple-dom*/
'use strict';
var _defaults = function (obj, defaults) {
    var keys = Object.getOwnPropertyNames(defaults);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = Object.getOwnPropertyDescriptor(defaults, key);
        if (value && value.configurable && obj[key] === undefined) {
            Object.defineProperty(obj, key, value);
        }
    }
    return obj;
};
var _interopRequireWildcard = function (obj) {
    return obj && obj.__esModule ? obj : { 'default': obj };
};
var _simpleDomDom = require('./simple-dom/dom.js');
var SimpleDOM = _interopRequireWildcard(_simpleDomDom);
if (typeof window !== 'undefined') {
    window.SimpleDOM = SimpleDOM;
}
_defaults(exports, _interopRequireWildcard(_simpleDomDom));
Object.defineProperty(exports, '__esModule', { value: true });