var List = require('list/list');

if (typeof window !== 'undefined' && !require.resolve && window.can) {
    window.can.DeriveList = List;
}

module.exports = {
    List: List
};