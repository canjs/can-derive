var can = require('can/util/util');
var Map = require('can/map/map');
var List = require('can/list/list');
var TreeList = require('can-redblacktree');

// Use a tree so that items are sorted by the source list's
// index in O(log(n)) time
var DerivedList = TreeList.extend({

    // A flag that determines if index influencing operations like shift
    // and splice should result in O(n) index compute updates
    _indexBound: false,

    filter: function (predicate, predicateContext) {
        if (! this._derivedList) {
            this._derivedList = new DerivedList(this);
        }

        var filteredList =
            new FilteredList(this._derivedList, predicate, predicateContext);

        // Set _indexBound to true if this filtered list depends on the
        // index. Once set to true there's no going back.
        if (! this._derivedList._indexBound && filteredList._indexBound) {
            this._derivedList._indexBound = true;
        }

        return filteredList;
    },

    init: function (sourceList) {

        var self = this;
        var args = can.makeArray(arguments);

        // Save a reference to the list we're deriving
        this._source = sourceList;

        // Setup the tree
        TreeList.prototype.init.apply(this, args.slice(1));

        // Make this list a reflection of the source list
        this.syncAdds();
        this.syncRemoves();
        this.syncValues();
    },

    syncAdds: function () {

        var self = this;

        // Add initial items
        this._source.each(function (item, index) {
            self.addItem(item, index);
        });

        // Add future items
        this._source.bind('add', function (ev, items, offset) {
            self.addItems(items, offset);
        });
    },

    syncRemoves: function () {

        var self = this;

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

    addItem: function (item, insertIndex) {
        var node;

        // Store information in a way that changes can be bound to
        var computes = {};
        computes.index = can.compute(insertIndex);
        computes.value = can.compute(item);

        // Don't dispatch the resulting "add" event until a reference
        // to the node has been saved to the `computes` object
        can.batch.start();
        node = this.set(insertIndex, computes, true);
        computes.node = node;
        can.batch.stop();

        this.propagateIndexAdjustment(insertIndex + 1);
    },

    propagateIndexAdjustment: function (affectedIndex) {

        var i, node;

        // When the `_indexBound` flag is true that means that a predicate
        // function of one of the filtered lists that use this derived list
        // as their source is bound to the index. This is unfortunate,
        // because now we have to manually update a compute that stores the
        // index so that the filtered list that is bound to the index can
        // re-run its predicate function for all of the items whos indices
        // have changed. Which of course now makes this an O(n) filter. And
        // worse, this will apply to the  filtered lists that don't depend
        // on the index too!
        if (this._indexBound) {

            i = affectedIndex;
            node = this.get(i);

            // Iterate using the linked-list, it's faster than
            // for (i) { this.get(i); }
            while (node) {
                node.data.index(i);
                node = node.next;
                i++;
            }
        }
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

    removeItem: function (item, removedIndex) {
        this.unset(removedIndex, true);
        this.propagateIndexAdjustment(removedIndex);
    },

    _printIndexesValue: function (node) {
        return node.data.value();
    },
});

// Handle the adding/removing of items to the derived list based on
// the predicate
var FilteredList = DerivedList.extend({

    init: function (sourceList, predicate, predicateContext) {

        // Overwrite the default predicate if one is provided
        if (predicate) {
            this.predicate = can.proxy(predicate, predicateContext);
        }

        // Mark this derived list as bound to indexes
        if (predicate.length > 1) {
            this._indexBound = true;
        }

        // Setup bindings, initialize the tree
        DerivedList.prototype.init.call(this, sourceList);
    },

    // A filtered list's source list is a derived list (the derived list stores
    // all of the potential values) who's values are computes that are kept
    // in sync with the derived list's source list for us
    syncValues: can.noop,

    syncRemoves: function () {

        var self = this;

        // Remove future items
        this._source.bind('pre-remove', function (ev, items, offset) {
            self.removeItems(items, offset);
        });
    },


    // Disable gaps in indexes
    _gapAndSize: function () {
        this.length++;
    },

    _comparator: function (_a, _b) {
        var a = this._normalizeComparatorValue(_a);
        var b = this._normalizeComparatorValue(_b);
        return a === b ? 0 : a < b ? -1 : 1; // ASC
    },

    _normalizeComparatorValue: function (value) {
        return value instanceof this.Node ?
            this._source.indexOfNode(value.data.node) :
            value;
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

            var index;

            // Ensure first change event's "oldVal" is `false`
            if (! initialized()) { return false; }

            // If the user has provided a predicate function that depends
            // on the index argument, bind to it directly; Everything's O(n)
            // from here on out (for this particular list)
            if (this._indexBound) {
                index = computes.index();
            }

            // Use the predicate function to determine if this
            // item should be included in the overall list
            return this.predicate(computes.value(), index);
        }, this);

        // Add/remove based predicate change
        include.bind('change', function (ev, newVal, oldVal) {
            var sourceIndex = self._source.indexOfNode(computes.node);

            if (newVal) {
                self.set(sourceIndex, computes, true);
            } else {
                self.unset(sourceIndex, true);
            }
        });

        // Trigger an "include" `change` event
        initialized(true);
    },

    removeItem: function (item, sourceIndex) {
        this.unset(sourceIndex, true);
    },

    // Abstract away the node data and return only the value compute's value
    attr: function () {
        if (arguments.length === 0) {
            var list = TreeList.prototype.attr.apply(this, arguments);

            return list;

        // Return the node data's "value" compute value
        } else if (arguments.length === 1) {
            var data = TreeList.prototype.attr.apply(this, arguments);

            // Node.data.value
            return data && data.value();
        }
    },

    // Iterate over the value computes' values instead of the node's data
    each: function (callback) {
        TreeList.prototype.each.call(this, function (node, i) {
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


List.prototype.filter = DerivedList.prototype.filter;

module.exports = List;