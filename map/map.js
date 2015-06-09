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

// TODO: Learn about helpers
// TODO: Move this into a helper
Map.prototype._isValidKey = function (key) {
    return key || key === 0;
};

module.exports = Map;