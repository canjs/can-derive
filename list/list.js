var Map = require('can/map/map');
var List = require('can/list/list');
var ComputeCollection = require('../compute-collection/compute-collection');
var RedBlackTree = require('can-redblacktree').RBTree;

// Handle the adding/removing of items to the derived list based on
// the predicate
List.prototype.filter = function (predicate) {

    // Derive a list of computes sorted by sourceKey
    var derived = new this.constructor();
    var computedCollection = new ComputeCollection(this);
    var tree = new RedBlackTree(function (a, b) {
        a = a.sourceKey();
        b = b.sourceKey();
        return a === b ? 0 : a < b ? -1 : 1; // Ascending
    });

    // NOTE: Bind to "key" because their value cannot naturally be `undefined`
    // like a "value" can. In other words, don't exclude an item because it's
    // "value" is `undefined`.
    computedCollection.bind('key', function (ev, newKey, oldKey, computes) {
        var insertIndex, removeIndex;

        // The "key" will either be true or false per the rules of the predicate
        // so we only need to handle add/remove (not a change in index)
        // TODO: Handle a change in index
        if (computes.key()) {

            // Get the index to insert at
            insertIndex = tree.insert(computes);

            // Insert
            if (insertIndex >= 0) {
                derived.splice(insertIndex, 0, computes);
            }
        } else {
            removeIndex = tree.remove(computes);

            if (removeIndex >= 0) {
                derived.splice(removeIndex, 1);
            }
        }
    });

    // Since the keys of a filtered map are sometimes dependent on the values,
    // derive those first.
    computedCollection.attr('valueFn', function () { return arguments[0]; });

    // Return true/false to determine which keys are included/excluded in the
    // derived map
    computedCollection.attr('keyFn', predicate);

    return derived._filter();
};

// Move items based on sourceKey changes
List.prototype._filter = function () {
    var derived = new this.constructor();
    var computedCollection = new ComputeCollection(this);

    // For now, this is to check the intermediary derived computes in the test
    derived._source = this;

    // TODO: Bind directly to sourceIndex, since key acts as a proxy here
    computedCollection.bind('key', function (ev, newVal, oldVal, computes) {
        if (derived._isValidKey(oldVal) &&
                derived.attr(oldVal) === computes.value()) {
            console.log('Remove:', oldVal);
            derived.splice(oldVal, 1);
            console.log(derived.attr())
        }

        // If there's a valid key, and the item isn't already in the correct
        // position (as would be the case with a splice), add it.
        if (derived._isValidKey(newVal)
            && derived.attr(newVal) !== computes.value()) {

            console.log('Add:', newVal, '=', computes.value());
            derived.splice(newVal, 0, computes.value());
            console.log(derived.attr())
        }
    });

    computedCollection.bind('value', function (ev, newVal, oldVal, computes) {
        if (derived._isValidKey(computes.key())) {
            console.log('Update:', computes.key(), '=', computes.value());
            derived.attr(computes.key(), computes.value());
            console.log(derived.attr())
        }
    });

    computedCollection.attr('valueFn', function (computes, i) {
        return computes.value();
    });

    computedCollection.attr('keyFn', function (computes, sourceIndex) {
        // Even though ComputeCollection binds to sourceIndex, something has
        // to be returned so that the compute fires "change" events
        return sourceIndex;
    });

    return derived;
};

module.exports = List;