/*can-derive@0.0.3#can-derive*/
var List = require('./list/list.js');
if (typeof window !== 'undefined' && !require.resolve && window.can) {
    window.can.DeriveList = List;
}
module.exports = { List: List };