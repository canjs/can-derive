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

        this._propagateIndexChange(i + 1);
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
        for (i; i < length; i++) {
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

            // Set all of the computes to undefined, notifying any listeners
            // that the key/value is no more
            computes.activated(false);

            // Remove it from the store
            self._computes.remove(computes);

            // Stop firing events
            computes.sourceKey.unbind();
            computes.key.unbind();
            computes.value.unbind();
        };

        // Index the current set of items
        this._source.each(function (item, key) {
            addItem(key);
        });

        // TODO: Submit PR to emit add/remove events on can.Map's
        // TODO: Find an elegant way to abstract the differences in map/list
        // events
        if (this._source instanceof List) {
            // Index items added to the source later
            this._source.bind('add', function (ev, newItems, offset) {
                can.each(newItems, function (item, i) {
                    addItem(offset + i);
                });
            });

            // Unbind/remove items from the store as they're removed from
            // the source
            this._source.bind('remove', function (ev, removedItems, offset) {
                can.each(removedItems, function (item, i) {
                    var sourceKey = offset + i;
                    removeItem(sourceKey);
                });
            });
        } else {
            this._source.bind('change', function (ev, attr, how, newVal, oldVal) {
                if (how === 'add') {
                    addItem(attr);
                } else if (how === 'remove') {
                    removeItem(attr);
                }
            });
        }
    },
    _bind: function (key) {
        var self = this;
        var computes = this._index(key);

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
    _index: function (key) {

        // A flag that enables/disables the key/value compute
        var activated = can.compute(false);

        // The key/index of the item in the source map/list
        var sourceKey = can.compute(key);

        var makeComputeFn = function (fnKey) {
            return function () {
                var fn = this.attr(fnKey);
                var i, item;


                // Changes from undefined to true once these computes are
                // bound to
                if (! activated()) { return; };

                // Bind to as few properties as possible until we have a
                // function to evaluate them
                if (! fn) { return; }

                i = sourceKey();
                item = this._source.attr(i);
                return fn(item, i);
            };
        };

        // A compute bound to the item's value
        // TODO: Find out if you can update a compute's function. This way
        // no computes are created unless you provide a valueFn.
        var computedValue = can.compute(makeComputeFn('valueFn'), this);

        // A compute bound to the item's key
        var computedKey = can.compute(makeComputeFn('keyFn'), this);

        return {
            activated: activated,
            sourceKey: sourceKey,
            key: computedKey,
            value: computedValue
        };
    },
    setup: function (source) {
        this._source = source;

        // Abstract the store manipulation methods into their own API
        this._computes = this._source instanceof List ?
            new ListStore() :
            new MapStore();

        return Map.prototype.setup.call(this);
    }
});

module.exports = ComputeCollection;