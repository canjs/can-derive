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
            var result = self.unset(index, true);
        });
    }
});

// Handle the adding/removing of items to the derived list based on
// the predicate
var FilteredList = DerivedList.extend({

    calculateGaps: false,

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

    // By default, include all items
    predicate: function () { return true; },

    // Bind to index/value and determine whether to include/exclude the item
    // based on the predicate function provided by the user
    addItem: function (computes) {
        var self = this;

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

            if (newVal) {
                self.set(sourceIndex, computes.value(), true);
            } else {
                self.unset(sourceIndex, true);
            }
        });

        // Sync values
        computes.value.bind('change', function (ev, newVal, oldVal) {
            var sourceIndex = self._source.indexOfNode(computes.node);
            self.set(sourceIndex, newVal);
        });

        // Trigger an "include" `change` event
        initialized(true);
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

    /*// Iterate over the value computes' values instead of the node's data
    each: function (callback) {
        RedBlackTree.prototype.each.call(this, function (data, i) {
            return callback(data, i);
        });
    },*/

    insert: function (data) {
        var insertIndex = this._parent.insert.apply(this, arguments);

        if (insertIndex >= 0) {
            this.dispatch('add', [[data.value()], insertIndex]);
        }

        return insertIndex;
    },

    // Trigger a "remove" event on successful insert
    remove: function (data) {

        // Get the node data before its removed from the tree
        var nodeData = this.find(data);

        // Remove, and get the index
        var removeIndex = this._parent.remove.apply(this, arguments);

        if (removeIndex >= 0) {
            this.dispatch('remove', [[nodeData.value()], removeIndex]);
        }

        return removeIndex;
    },

});


List.prototype.filter = function (predicate, context, predicateContext) {
    var derivedList = new DerivedList(this);
    var filteredList =
        new FilteredList(derivedList, predicate, predicateContext);
    return filteredList;
};

module.exports = List;