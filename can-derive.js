var List = require('list/list');

var derivePlugin = {
    List: List
};

// Register the modified RBTreeList to the `can` namespace
if (typeof window !== 'undefined' && !require.resolve && window.can) {
    window.can.derive = derivePlugin;
}

module.exports = derivePlugin;