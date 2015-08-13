/*lib/simple-dom*/
define([
    'exports',
    './simple-dom/dom'
], function (exports, _simpleDomDom) {
    'use strict';
    var _interopRequireWildcard = function (obj) {
        return obj && obj.__esModule ? obj : { 'default': obj };
    };
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
    var SimpleDOM = _simpleDomDom;
    if (typeof window !== 'undefined') {
        window.SimpleDOM = SimpleDOM;
    }
    _defaults(exports, _interopRequireWildcard(_simpleDomDom));
    Object.defineProperty(exports, '__esModule', { value: true });
});