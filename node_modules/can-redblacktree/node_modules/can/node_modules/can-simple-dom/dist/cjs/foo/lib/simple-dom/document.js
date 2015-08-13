/*lib/simple-dom/document*/
'use strict';
var _interopRequire = function (obj) {
    return obj && obj.__esModule ? obj['default'] : obj;
};
var Node = _interopRequire(require('./document/node.js'));
var Element = _interopRequire(require('./document/element.js'));
var Text = _interopRequire(require('./document/text.js'));
var Comment = _interopRequire(require('./document/comment.js'));
var DocumentFragment = _interopRequire(require('./document/document-fragment.js'));
function Document() {
    this.nodeConstructor(9, '#document', null, this);
    this.documentElement = new Element('html', this);
    this.body = new Element('body', this);
    this.documentElement.appendChild(this.body);
    this.appendChild(this.documentElement);
}
Document.prototype = Object.create(Node.prototype);
Document.prototype.constructor = Document;
Document.prototype.nodeConstructor = Node;
Document.prototype.createElement = function (tagName) {
    return new Element(tagName, this);
};
Document.prototype.createTextNode = function (text) {
    return new Text(text, this);
};
Document.prototype.createComment = function (text) {
    return new Comment(text, this);
};
Document.prototype.createDocumentFragment = function () {
    return new DocumentFragment(this);
};
Document.prototype.getElementsByTagName = function (name) {
    name = name.toUpperCase();
    var elements = [];
    var cur = this.firstChild;
    while (cur) {
        if (cur.nodeType === Node.ELEMENT_NODE) {
            if (cur.nodeName === name || name === '*') {
                elements.push(cur);
            }
            elements.push.apply(elements, cur.getElementsByTagName(name));
        }
        cur = cur.nextSibling;
    }
    return elements;
};
module.exports = Document;