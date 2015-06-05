var compute = require('can/compute/compute');
var Map = require('can/map/map');
var List = require('can/list/list');

var MapStore = can.Construct({}, {
    init: function () {
        this._store = {};
    },
    add: function (computes) {
        this._store[computes.sourceKey()] = computes;
    },
    remove: function (computes) {
        delete this._store[computes.sourceKey()];
    }
});

var ListStore = can.Construct({}, {
    init: function () {
        this._store = [];
    },
    add: function (computes) {
        var i = computes.sourceKey();
        var length;

        // Save the computes at the same index as they are in their
        // source list
        this._store.splice(i, 0, computes);

        this._propagateIndexChange(i);
    },
    remove: function (computes) {
        var i = computes.sourceKey();
        var length;

        this._store.splice(i, 1);

        this._propagateIndexChange(i);
    },
    _propagateIndexChange: function (i) {
        // Cache the length
        length = this._store.length;

        // Batch
        can.batch.start();

        // Update the remaining sourceKeys manually, as the index' would
        // in a native list
        for (i++; i < length; i++) {
            this._store[i].sourceKey(i);
        }

        can.batch.stop();
    }
});

var ComputeCollection = can.ComputeCollection = Map.extend({}, {
    _bindsetup: function () {
        var self = this;
        var addItem = function (key) {
            self._computes.add(self._bind(key));
        };
        var removeItem = function (key) {
            var computes = self._computes._store[key];

            self._computes.remove(computes);

            computes.sourceKey.unbind();
            computes.key.unbind();
            computes.value.unbind();
        };

        // Abstract the store manipulation methods into their own
        this._computes = this._source instanceof List ?
            new ListStore() :
            new MapStore();

        // Index the current set of items
        this._source.each(function (item, key) {
            addItem(key);
        });

        // Index items added to the source later
        this._source.bind('add', function (ev, newItems, offset) {
            can.each(newItems, function (item, i) {
                addItem(offset + i);
            });
        });

        // Unbind/remove items from the store as they're removed from
        // the source
        /*this._source.bind('remove', function (ev, removedItems, offset) {
            can.each(removedItems, function (item, i) {
                var sourceKey = offset + i;
                removeItem(sourceKey);
            });
        });*/

        this._source.bind('change', function (ev, attr, how, newVal, oldVal) {
            if (how === 'remove') {
                removeItem(attr);
            }
        });
    },
    _bind: function (key) {
        var self = this;
        var computes = this._index(key);

        computes.key.bind('change', function (ev, newVal, oldVal) {
            self._triggerChange('key', 'set', newVal, oldVal);
        });
        computes.value.bind('change', function (ev, newVal, oldVal) {
            self._triggerChange('value', 'set', newVal, oldVal);
        });

        return computes;
    },
    _index: function (key) {

        // The key/index of the item in the source map/list
        var sourceKey = can.compute(key);

        // A compute bound to the item's value
        var computedValue = can.compute(function () {
            var i = sourceKey();
            var item = this._source.attr(i);
            return this.attr('valueFn')(item, i);
        }, this);

        // A compute bound to the item's key
        var computedKey = can.compute(function () {
            var i = sourceKey();
            var item = this._source.attr(i);
            return this.attr('keyFn')(item, i);
        }, this);

        return {
            sourceKey: sourceKey,
            key: computedKey,
            value: computedValue
        };
    },
    setup: function (source) {
        this._source = source;

        return Map.prototype.setup.call(this, {
            keyFn: can.noop,
            valueFn: can.noop
        });
    }
});

module.exports = ComputeCollection;