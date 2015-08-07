var Map = require('can/map/map');
var List = require('can/list/list');
var RedBlackTree = require('can-redblacktree');

// Use a tree so that items are sorted by the source list's
// index in O(log(n)) time
var DerivedList = RedBlackTree.extend({

    init: function (sourceList) {

        var self = this;
        var args = can.makeArray(arguments);

        // Save a reference to the list we're deriving
        this._source = sourceList;

        // Setup the tree
        RedBlackTree.prototype.init.apply(this, args.slice(1));

        // Make this list a reflection of the source list
        this.syncItems();
        this.syncValues();
    },

    syncItems: function () {

        var self = this;

        // Add initial items
        this._source.each(function (item, index) {
            self.addItem(item, index);
        });

        // Add future items
        this._source.bind('add', function (ev, items, offset) {
            self.addItems(items, offset);
        });

        // Remove future items
        this._source.bind('remove', function (ev, items, offset) {
            self.removeItems(items, offset);
        });
    },

    syncValues: function () {

        var self = this;

        // Handle future changes in value to existing items
        var ___set = this._source.___set;
        this._source.___set = function (index, value) {

            // Cast as a number
            index = +index;

            // Get a reference to the "computes" object
            var computes = self.get(index).data;

            if (computes) {
                // Update the value, thus triggering a `change` event
                computes.value(value);
            }

            // Continue the `set` on the source list
            return ___set.apply(this, arguments);
        };
    },

    addItems: function (items, offset) {
        var self = this;

        can.each(items, function (item, i) {
            self.addItem(item, offset + i);
        });
    },

    addItem: function (item, index) {

        // Store information in a way that changes can be bound to
        var computes = {};
        computes.index = can.compute(index);
        computes.value = can.compute(item);

        // Don't dispatch the resulting "add" event until a reference
        // to the node has been saved to the `computes` object
        can.batch.start();
        var node = this.set(index, computes, true);
        computes.node = node;
        can.batch.stop();
    },

    removeItems: function (items, offset) {
        var self = this;
        var iterator, lastRemovedIndex;

        // Remove each item
        can.each(items, function (item, i) {
            var index = offset + i;
            self.removeItem(item, index);
        });
    },

    removeItem: function (item, index) {
        this.unset(index, true);
    }
});

// Handle the adding/removing of items to the derived list based on
// the predicate
var FilteredList = DerivedList.extend({

    init: function (sourceList, predicate, predicateContext) {

        // Overwrite the default predicate if one is provided
        if (predicate) {
            this.predicate = can.proxy(predicate, predicateContext);
        }

        // Setup bindings, initialize the tree
        DerivedList.prototype.init.call(this, sourceList);
    },

    // A filtered list's source list is a derived list (the derived list stores
    // all of the potential values) who's values are computes that are kept
    // in sync with the derived list's source list for us
    syncValues: can.noop,

    _printIndexesValue: function (node) {
        return node.data.value();
    },

    // Disable gaps in indexes
    _gapAndSize: function () {
        this.length++;
    },

    _sourceComparator: function (_a, _b) {
        var a = _a instanceof this.Node ? this._source.indexOfNode(_a.data.node) : _a;
        var b = _b instanceof this.Node ? this._source.indexOfNode(_b.data.node) : _b;

        return a === b ? 0 : a < b ? -1 : 1; // ASC
    },

    _filterComparator: function (_a, _b) {
        var a = _a instanceof this.Node ? this.indexOfNode(_a.data.filteredNode) : _a;
        var b = _b instanceof this.Node ? this.indexOfNode(_b.data.filteredNode) : _b;

        return a === b ? 0 : a < b ? -1 : 1; // ASC
    },

    // By default, include all items
    predicate: function () { return true; },

    // Bind to index/value and determine whether to include/exclude the item
    // based on the predicate function provided by the user
    addItem: function (node) {
        var self = this;
        var computes = node.data;

        // Default to false
        var initialized = can.compute(false);

        // Determine whether to include or not
        var include = can.compute(function () {

            // Ensure first change event's "oldVal" is `false`
            if (! initialized()) { return false; }

            // Use the predicate function to determine if this
            // item should be included in the overall list
            return this.predicate(computes.value(), computes.index());
        }, this);

        // Add/remove based predicate change
        include.bind('change', function (ev, newVal, oldVal) {
            var sourceIndex = self._source.indexOfNode(computes.node);
            var filteredNode;

            self._comparator = self._sourceComparator;

            if (newVal) {

                filteredNode = self.set(sourceIndex, computes, true);
                computes.filteredNode = filteredNode;
            } else {
                self.unset(sourceIndex, true);
                delete computes.filteredNode;
            }
        });

        // Trigger an "include" `change` event
        initialized(true);
    },

    removeItem: function (node) {
        var filteredNode = node.data.filteredNode;

        this._comparator = this._filterComparator;

        if (filteredNode) {
            index = this.indexOfNode(filteredNode);
            this.unset(index, true);
            delete node.data.filteredNode;
        }
    },

    // Abstract away the node data and return only the value compute's value
    attr: function () {

        if (arguments.length === 0) {
            var list = RedBlackTree.prototype.attr.apply(this, arguments);

            return list;

        // Return the node data's "value" compute value
        } else if (arguments.length === 1) {
            var data = RedBlackTree.prototype.attr.apply(this, arguments);

            // Node.data.value
            return data && data.value();
        }
    },

    // Iterate over the value computes' values instead of the node's data
    each: function (callback) {
        RedBlackTree.prototype.each.call(this, function (node, i) {
            return callback(node.data.value(), i);
        });
    },

    _dispatchAdd: function (node, index) {
        this.dispatch('add', [[node.data.value()], index]);
    },

    _dispatchRemove: function (node, index) {
        this.dispatch('remove', [[node.data.value()], index]);
    }
});


List.prototype.filter = function (predicate, predicateContext) {
    var derivedList = new DerivedList(this);
    var filteredList =
        new FilteredList(derivedList, predicate, predicateContext);
    return filteredList;
};

module.exports = List;