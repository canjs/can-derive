var Map = require('can/map/map');
var List = require('can/list/list');
var ComputeCollection = require('../compute-collection/compute-collection');
var RedBlackTree = require('can-redblacktree').RBTree;

// Handle the adding/removing of items to the derived list based on
// the predicate
List.prototype.filter = function (predicate) {

    var tree = new RedBlackTree(function (a, b) {
        var result;

        a = a.sourceIndex;
        b = b.sourceIndex;

        return a === b ? 0 : a < b ? -1 : 1; // Ascending
    });
    var transactionId = 0;
    var computes = [];

    var insert = function (compute) {

        var itemExists = tree.find({
            sourceIndex: compute.sourceIndex()
        });

        var iterator;

        // Handle .splice()
        if (itemExists) {
            iterator = tree.findIter({
                sourceIndex: compute.sourceIndex()
            });

            iterator.rest(function (data) {
                data.sourceIndex += 1;
            });
        }

        var data = {
            sourceIndex: compute.sourceIndex(),
            value: compute.value()
        };

        tree.insert(data);

        compute.value.bind('change', function (ev, newVal, oldVal) {
            data.value = newVal;
        });
    };

    var add = function (item, i) {

        var compute = {};
        compute.initialized = can.compute(false);
        compute.sourceIndex = can.compute(i);
        compute.value = can.compute(item);
        compute.include = can.compute(function () {
            if (! compute.initialized()) { return undefined; }
            return predicate(compute.value(), compute.sourceIndex());
        });

        computes[i] = compute;

        compute.include.bind('change', function (ev, newVal, oldVal) {
            if (! oldVal && newVal) {
                insert(compute);
            }

            // TODO: Handle a predicate change from true > false
            if (oldVal && ! newVal) {
                extract(item);
            }
        });

        // Trigger the binding
        compute.initialized(true);

        for (i++; i < computes.length; i++) {
            computes[i].sourceIndex(i);
        }
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

        can.each(items, function (item, i) {
            var index = offset + i;

            var result = tree.remove({
                sourceIndex: index
            });

            computes.splice(index, 1);

            lastRemovedIndex = index;
        });

        iterator = tree.lowerBound({
            sourceIndex: lastRemovedIndex + 1
        });

        if (! iterator) {
            return;
        }

        iterator.rest(function (data) {
            data.sourceIndex += -(items.length);
        });
    });

    // Update values on set
    var ___set = this.___set;
    this.___set = function (key, value) {
        computes[key].value(value);
        return ___set.apply(this, arguments);
    };

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

        return data ? data.value : undefined; // -1 === undefined
    };

    // Make each return item instead of data
    tree._each = tree.each;
    tree.each = function (callback) {
        var i = 0;
        tree._each.call(this, function (data) {
            var result = callback(data.value, i);
            i++;
            return result;
        });
    };

    return tree;
};

module.exports = List;