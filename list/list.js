var Map = require('can/map/map');
var List = require('can/list/list');
var ComputeCollection = require('../compute-collection/compute-collection');
var RedBlackTree = require('can-redblacktree');

// Handle the adding/removing of items to the derived list based on
// the predicate
List.prototype.derive = function (predicate) {

    // Use a tree so that items are sorted by the source list's
    // index in O(log(n)) time
    var tree = new RedBlackTree(function (a, b) {
        a = a.index.isComputed ? a.index() : a.index;
        b = b.index.isComputed ? b.index() : b.index;
        return a === b ? 0 : a < b ? -1 : 1; // ASC
    });

    var add = function (item, index) {

        // Store information in a way that changes can be bound to
        var computes = {};
        computes.index = can.compute(index);
        computes.value = can.compute(item);

        // Ghetto splice (part 1 of 3)
        var iterator = tree.findIter(computes);

        // Ghetto splice (part 2 of 3)
        if (iterator !== null) {
            iterator.rest(function (data) {
                data.index(data.index() + 1);
            });
        }

        // Ghetto splice (part 3 of 3)
        tree.insert(computes);
    };

    // Add initial items
    this.each(add);

    // Add future items
    this.bind('add', function (ev, items, offset) {
        can.each(items, function (item, i) {
            add(item, offset + i);
        });
    });

    // Remove future items
    this.bind('remove', function (ev, items, offset) {
        var iterator, lastRemovedIndex;

        // Remove each item
        can.each(items, function (item, i) {
            var index = offset + i;

            var result = tree.remove({
                index: index
            });

            lastRemovedIndex = index;
        });

        // Find the item after the remove(s)
        iterator = tree.lowerBound({
            index: lastRemovedIndex + 1
        });

        // Decrement the remaining items' index by the number
        // of items removed
        if (iterator !== null) {
            iterator.rest(function (computes) {
                computes.index(computes.index() - items.length);
            });
        }
    });

    // Handle future changes in value to existing items
    var ___set = this.___set;
    this.___set = function (index, value) {

        // Cast as <int>
        index = +index;

        // Get a reference to the "computes" object
        var computes = tree.find({
            index: index
        });

        if (computes) {
            // Update the value, thus triggering a `change` event
            computes.value(value);
        }

        // Continue the `set` on the source list
        return ___set.apply(this, arguments);
    };

    return tree;
};


RedBlackTree.prototype.filter = function (predicate) {

    var tree = new RedBlackTree(function (a, b) {
        a = a.index.isComputed ? a.index() : a.index;
        b = b.index.isComputed ? b.index() : b.index;
        return a === b ? 0 : a < b ? -1 : 1; // ASC
    });

    // Bind and insert/remove
    var register = function (computes) {

        // Default to false
        var initialized = can.compute(false);

        // Determine whether to include or not
        var include = can.compute(function () {

            // Ensure first change event's "oldVal" is `false`
            if (! initialized()) { return false; }

            return predicate(computes.value(), computes.index());
        });

        // Add/remove based predicate change
        include.bind('change', function (ev, newVal, oldVal) {

            if (newVal) {
                // Don't worry about splice, because the index'
                // are already managed by .derive()
                tree.insert(computes);
            } else {
                tree.remove(computes);
            }
        });

        // Trigger an "include" `change` event
        initialized(true);
    };

    // Add initial items
    this.each(function (item, i) {
        register(item, i);
    });

    // Add future items
    this.bind('add', function (ev, items, offset) {
        can.each(items, function (item, i) {
            register(item, offset + i);
        });
    });

    // Remove items when removed from the source list
    this.bind('remove', function (ev, items, offset) {
        can.each(items, function (item, i) {
            var index = offset + i;

            tree.remove({
                index: index
            });
        });
    });

    // Read at known index
    tree.attr = function (index) {

        if (index === undefined) {
            var items = [];
            this.each(function (item) {
                items.push(item);
            });
            return items;
        }

        var data = tree.findAtIndex(index);

        // -1 === undefined
        return data !== -1  ? data.value() : undefined;
    };

    // Make each return item instead of data
    tree._each = tree.each;
    tree.each = function (callback) {
        var i = 0;
        tree._each.call(this, function (data) {
            var result = callback(data.value(), i);
            i++;
            return result;
        });
    };

    return tree;
};

module.exports = List;