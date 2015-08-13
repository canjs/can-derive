/*can-simple-dom@0.2.9#simple-dom/document/extend*/
define([
    'exports',
    'module'
], function (exports, module) {
    'use strict';
    module.exports = function (a, b) {
        for (var p in b) {
            a[p] = b[p];
        }
        return a;
    };
});