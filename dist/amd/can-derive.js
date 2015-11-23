/*can-derive@0.0.10#can-derive*/
define(function (require, exports, module) {
    var List = require('./list/list');
    var derivePlugin = { List: List };
    if (typeof window !== 'undefined' && !require.resolve && window.can) {
        window.can.derive = derivePlugin;
    }
    module.exports = derivePlugin;
});