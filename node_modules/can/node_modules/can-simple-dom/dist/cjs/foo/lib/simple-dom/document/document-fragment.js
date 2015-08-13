/*lib/simple-dom/document/document-fragment*/
'use strict';
var _interopRequire = function (obj) {
    return obj && obj.__esModule ? obj['default'] : obj;
};
var Node = _interopRequire(require('./node.js'));
function DocumentFragment(ownerDocument) {
    this.nodeConstructor(11, '#document-fragment', null, ownerDocument);
}
DocumentFragment.prototype._cloneNode = function () {
    return this.ownerDocument.createDocumentFragment();
};
DocumentFragment.prototype = Object.create(Node.prototype);
DocumentFragment.prototype.constructor = DocumentFragment;
DocumentFragment.prototype.nodeConstructor = Node;
module.exports = DocumentFragment;