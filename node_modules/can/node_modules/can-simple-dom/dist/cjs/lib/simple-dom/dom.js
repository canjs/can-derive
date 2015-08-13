/*lib/simple-dom/dom*/
'use strict';
var _interopRequire = function (obj) {
    return obj && obj.__esModule ? obj['default'] : obj;
};
var Node = _interopRequire(require('./document/node.js'));
var Element = _interopRequire(require('./document/element.js'));
var Document = _interopRequire(require('./document.js'));
var HTMLParser = _interopRequire(require('./html-parser.js'));
var HTMLSerializer = _interopRequire(require('./html-serializer.js'));
var voidMap = _interopRequire(require('./void-map.js'));
exports.Node = Node;
exports.Element = Element;
exports.Document = Document;
exports.HTMLParser = HTMLParser;
exports.HTMLSerializer = HTMLSerializer;
exports.voidMap = voidMap;
Object.defineProperty(exports, '__esModule', { value: true });