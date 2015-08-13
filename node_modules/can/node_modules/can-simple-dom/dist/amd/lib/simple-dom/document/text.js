/*lib/simple-dom/document/text*/
define([
    'exports',
    'module',
    './node'
], function (exports, module, _node) {
    'use strict';
    var _interopRequire = function (obj) {
        return obj && obj.__esModule ? obj['default'] : obj;
    };
    var Node = _interopRequire(_node);
    function Text(text, ownerDocument) {
        this.nodeConstructor(3, '#text', text, ownerDocument);
    }
    Text.prototype._cloneNode = function () {
        return this.ownerDocument.createTextNode(this.nodeValue);
    };
    Text.prototype = Object.create(Node.prototype);
    Text.prototype.constructor = Text;
    Text.prototype.nodeConstructor = Node;
    module.exports = Text;
});