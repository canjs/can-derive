/*can-derive@0.0.10#can-derive*/
var List = require('./list/list.js');
var derivePlugin = { List: List };
if (typeof window !== 'undefined' && !require.resolve && window.can) {
    window.can.derive = derivePlugin;
}
module.exports = derivePlugin;