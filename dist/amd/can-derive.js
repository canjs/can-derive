/*can-derive@0.0.3#can-derive*/
define(function (require, exports, module) {
    var List = require('./list/list');
    if (typeof window !== 'undefined' && !require.resolve && window.can) {
        window.can.DeriveList = List;
    }
    module.exports = { List: List };
});