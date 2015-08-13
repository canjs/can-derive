var Map = require('can/map/map');
var Construct = require('can/construct/construct');
var TreeLib = require('./lib/rbtreelist');

// Copy
var treeLibProto = can.simpleExtend({}, TreeLib.prototype);

// Save to "can" namespace
can.TreeList = can.Construct.extend(can.simpleExtend(treeLibProto, {

    init: function () {

        // Call the original constructor
        TreeLib.apply(this, arguments);
    },

    // Save a reference to the TreeLib prototype methods
    _parent: TreeLib.prototype,

    // Trigger a "add" event when length increases
    set: function (index) {
        var lastLength = this.length;
        var insertIndex;

        var node = TreeLib.prototype.set.apply(this, arguments);

        if (this.length > lastLength) {
            insertIndex = this.indexOfNode(node);
            this._dispatchAdd(node, insertIndex);
            this._dispatchLength(lastLength);
        }

        return node;
    },

    // Trigger a "remove" event when length decreases
    unset: function (index) {

        var lastLength = this.length;
        var removeIndex;

        // Unset or remove
        var node = this.get(index);

        if (node) {
            // The index that retrieves the node and the index
            // that the node resides can be different
            removeIndex = this.indexOfNode(node);
            TreeLib.prototype.unset.apply(this, arguments);
        }

        if (this.length < lastLength) {
            this._dispatchRemove(node, removeIndex);
            this._dispatchLength();
        }

        return node;
    },

    _dispatchAdd: function (node, index) {
        this.dispatch('add', [[node], index]);
    },

    _dispatchRemove: function (node, index) {
        this.dispatch('remove', [[node], index]);
    },

    _dispatchLength: function () {
        this.dispatch('length', [this.length]);
    },

    attr: function (index, value) {

        var items, node;

        // Return a list all the nodes' data
        if (arguments.length === 0) {
            items = [];

            this.each(function (item) {

                // Convert can.Map's/can.List's to objects/arrays
                if (item instanceof can.Map || item instanceof can.List) {
                    item = item.attr();
                }

                items.push(item);
            });

            return items;

        // Get the data of a node by index
        } else if (arguments.length === 1) {

            node = this.get(index);
            return node ? node : undefined;

        // Set the data of a node by index
        } else if (arguments.length === 2) {

            node = this.set(index, value);
            return node;
        }
    }

}));

// Add event utilities
can.extend(can.TreeList.prototype, can.event);

module.exports = can.TreeList;

