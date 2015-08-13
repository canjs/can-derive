/*lib/simple-dom/dom*/
define([
    'exports',
    './document/node',
    './document/element',
    './document',
    './html-parser',
    './html-serializer',
    './void-map'
], function (exports, _documentNode, _documentElement, _document, _htmlParser, _htmlSerializer, _voidMap) {
    'use strict';
    var _interopRequire = function (obj) {
        return obj && obj.__esModule ? obj['default'] : obj;
    };
    var Node = _interopRequire(_documentNode);
    var Element = _interopRequire(_documentElement);
    var Document = _interopRequire(_document);
    var HTMLParser = _interopRequire(_htmlParser);
    var HTMLSerializer = _interopRequire(_htmlSerializer);
    var voidMap = _interopRequire(_voidMap);
    exports.Node = Node;
    exports.Element = Element;
    exports.Document = Document;
    exports.HTMLParser = HTMLParser;
    exports.HTMLSerializer = HTMLSerializer;
    exports.voidMap = voidMap;
    Object.defineProperty(exports, '__esModule', { value: true });
});