var can = require('can/util/util');
var compute = require('can/compute/compute');
var Map = require('can/map/map');
var List = require('can/list/list');
var RedBlackTree = require('can-redblacktree').RBTree;

var MapCollection = {
    _makeStore: function () {
        return {};
    },
    _subscribe: function () {
        var self = this;

        // TODO: Submit PR to emit add/remove events on can.Map's
        this._source.bind('change', function (ev, attr, how, newVal, oldVal) {
            if (how === 'add') {
                self._addItem(attr);
            } else if (how === 'remove') {
                self._removeItem(attr);
            }
        });
    },
    _getCompute: function (sourceKey) {
        return this._collection[sourceKey];
    },
    __addItem: function (computes) {
        this._collection[computes.sourceKey()] = computes;
    },
    __removeItem: function (sourceKey) {
        delete this._collection[sourceKey];
    }
};

var ListCollection = {
    _makeStore: function () {
        return new RedBlackTree(function (a, b) {
            a = a.sourceKey.isComputed ? a.sourceKey(): a.sourceKey;
            b = b.sourceKey.isComputed ? b.sourceKey(): b.sourceKey;
            return a === b ? 0 : a < b ? -1 : 1; // ASC
        });
    },
    _subscribe: function () {
        var self = this;

        // Update sourceValue when list.attr([index], [value]) is called
        var ___set = this._source.___set;
        this._source.___set = function (attr, value) {

            // Cast as Number
            attr = +attr;

            // If this value doesn't already exist on the object
            // this is likely a "set" and we don't want to handle it here
            if (this[attr] === undefined) {
                return;
            }

            var computes = self._collection.find({
                sourceKey: attr
            });
            // Update the sourceValue instead of executing the key/value
            // function whenever value changes at this._source.attr(sourceKey);
            computes.sourceValue(value);

            // Don't interfere with the soure list's set
            return ___set.apply(this, arguments);
        };

        // Index items added to the source later
        this._source.bind('add', function (ev, newItems, offset) {
            can.each(newItems, function (item, i) {
                var sourceIndex = offset + i;
                self._addItem(sourceIndex);
            });
        });

        // Unbind/remove items from the collection as they're removed from
        // the source
        this._source.bind('remove', function (ev, removedItems, offset) {
            can.each(removedItems, function (item, i) {
                var sourceIndex = offset + i;
                self._removeItem(sourceIndex);
            });
        });
    },
    _getCompute: function (sourceIndex) {

        // Find the computes using an object that the comparator can
        // evaluate against each item
        var computes = this._collection.find({
            sourceKey: sourceIndex
        });

        return computes;
    },
    __addItem: function (computes) {
        // Update the rest of the list items
        this._propagate(computes.sourceKey(), 1);

        this._collection.insert(computes);
    },
    __removeItem: function (sourceIndex) {

        // Get a reference to the computes item
        var computes = this._collection.find({
            sourceKey: sourceIndex
        });

        // Remove this computes item from the collection
        this._collection.remove(computes);

        // Update the rest of the list items
        this._propagate(sourceIndex + 1, -1);
    },
    _propagate: function (startingSourceIndex, offset) {

        var iter = this._collection.findIter({
            sourceKey: startingSourceIndex
        });

        if (iter === null) {
            return;
        }

        iter.rest(function (item) {
            item.sourceKey(item.sourceKey() + offset);
        });
    }
};

var ComputeCollection = can.ComputeCollection = Map.extend({}, {
    _bindsetup: function () {
        var self = this;

        // Mixin the methods used to store/manage the metadata associated
        // with each item in the map/list
        if (this._source instanceof List) {
            can.extend(this, ListCollection);
        } else if (this._source instanceof Map) {
            can.extend(this, MapCollection);
        }

        // Initialize the collection
        this._collection = this._makeStore();

        // Index the current set of items
        this._source.each(function (item, attr) {
            self._addItem(attr);
        });

        // Handle the adding/removing of items
        this._subscribe();
    },
    _bindToKeyValueChange: function (sourceKey) {
        var self = this;
        var computes = this._computeMeta(sourceKey);

        computes.value.bind('change', function (ev, newVal, oldVal) {
            can.batch.trigger(self, 'value', [newVal, oldVal, computes]);
        });
        computes.key.bind('change', function (ev, newVal, oldVal) {
            can.batch.trigger(self, 'key', [newVal, oldVal, computes]);
        });

        // Trigger a change manually, thus settting the initial values
        computes.activated(true);

        return computes;
    },
    _computeMeta: function (sourceKey) {

        // Save reference to the returned computes object so that it can
        // be retrieved from the tree
        var computes = {};

        var makeComputeFn = function (fnKey) {
            return function () {
                var self = this;
                var fn = this.attr(fnKey);
                var i, item;

                // Changes from undefined to true once these computes are
                // bound to
                if (! computes.activated()) { return; }

                // Bind to as few properties as possible until we have a
                // function to evaluate them
                if (! fn) { return; }

                // Find the index using an object that the comparator can
                // evaluate against each item
                i = computes.sourceKey();

                // Get the value from the source list/map
                item = computes.sourceValue();

                // Pass functions so that bindings aren't created unless
                // they're actually needed. We'll be updating .attr
                // and .sortKey a lot (in the case of lists), so we don't
                // want unnecessary executions of these computes if we can
                // help it.

                return fn(item, i);
            };
        };

        // A flag that enables/disables the key/value compute
        computes.activated = can.compute(false);

        // A compute that holds a reference to the source map/lists value
        // NOTE: This value is updated by the map/lists _subscribe function
        computes.sourceValue = can.compute(this._source.attr(sourceKey));
        // The key that's used to read the source value of this item from
        // the source map/list
        computes.sourceKey = can.compute(sourceKey);

        // A compute bound to the item's key
        computes.key = can.compute(makeComputeFn('keyFn'), this);

        // A compute bound to the item's value
        // TODO: Find out if you can update a compute's function. This way
        // no computes are created unless you provide a valueFn.
        computes.value = can.compute(makeComputeFn('valueFn'), this);

        return computes;
    },
    _addItem: function (sourceKey) {
        var computes = this._bindToKeyValueChange(sourceKey);

        // Update the number of items in the collection
        this.length++;

        return this.__addItem(computes);
    },
    _removeItem: function (attr) {

        var compute = this._getCompute(attr);

        // Update the number of items in the collection
        this.length--;

        // Set all of the computes to undefined, notifying any listeners
        // that the key/value is no more
        compute.activated(false);

        // Remove the item from the meta collection
        this.__removeItem(attr);

        // Stop firing events
        // TODO: Find a way to unbind without interrupting the handlers
        // compute.sourceValue.unbind('change');
        // compute.sourceKey.unbind('change');
        // compute.key.unbind('change');
        // compute.value.unbind('change');
    },
    setup: function (source) {

        // Save a reference to the original map/list
        this._source = source;

        // A counter of the number of properties stored in the collection
        this.length = 0;

        // Continue
        return Map.prototype.setup.call(this);
    }
});

module.exports = ComputeCollection;