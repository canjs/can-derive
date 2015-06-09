var Map = require('can/map/map');
var ComputeCollection = require('../compute-collection/compute-collection');

// Setup the filter
Map.prototype.filter = function (predicate) {
    var derived = new this.constructor();
    var computedCollection = new ComputeCollection(this);

    // Bind to "key" because their value cannot naturally be `undefined`
    // like a "value" can. In other words, don't exclude an item because it's
    // "value" is `undefined`.
    computedCollection.bind('key', function (ev, newKey, oldKey, computes) {
        if (computes.key()) {
            derived.attr(computes.sourceKey(), computes.value());
        } else {
            derived.removeAttr(computes.sourceKey());
        }
    });

    computedCollection.bind('value', function (ev, newKey, oldKey, computes) {
        if (computes.key()) {
            derived.attr(computes.sourceKey(), computes.value());
        }
    });

    // Since the keys of a filtered map are sometimes dependent on the values,
    // derive those first.
    computedCollection.attr('valueFn', function () { return arguments[0]; });

    // Return true/false to determine which keys are included/excluded in the
    // derived map
    computedCollection.attr('keyFn', predicate);

    return derived;
};

Map.prototype.pluck = function (attr) {
    var derived = new this.constructor();
    var computedCollection = new ComputeCollection(this);

    computedCollection.bind('key', function (ev, newKey, oldKey, computes) {

        // Remove
        if (derived._isValidKey(oldKey)) {
            derived.removeAttr(oldKey);
        }

        // Add
        derived.attr(newKey, computes.value());
    });

    computedCollection.bind('value', function (ev, newVal, oldVal, computes) {
        derived.attr(computes.key(), computes.value());
    });

    computedCollection.attr('valueFn', function (item, i) {
        return item && can.isFunction(item.attr) ? item.attr(attr) : item;
    });

    computedCollection.attr('keyFn', function (item, sourceKey) {
        return sourceKey;
    });

    return derived;
};

// TODO: Learn about helpers
// TODO: Move this into a helper
Map.prototype._isValidKey = function (key) {
    return key || key === 0;
};

module.exports = Map;