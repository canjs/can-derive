var List = require('can/list/list');
var RBTreeList = require('can-binarytree').RBTreeList;
require('can/compute/compute');
require('can/util/util');

var __observe = can.__observe;
var __observeAbstractValues = false;
var _triggerChange, __observeException, __predicateObserve,
    DerivedList, FilteredList, FilterPluginList, ObservedPredicate;


// Dispatch a `__values` event alongside all other `can.Map` events as
// a non-recursive alternative to `change` events
_triggerChange = can.Map.prototype._triggerChange;
can.Map.prototype._triggerChange = function (attr, how, newVal, oldVal) {
    _triggerChange.apply(this, arguments);

    can.batch.trigger(this, {
        type: '__values',
        target: this
    }, [newVal, oldVal]);
};

// Create an observe function that can be configured remotely to bind
// differently to maps and children of the source list
__predicateObserve = function (obj, event) {
    if (obj === __observeException) {
        return;
    }

    if (__observeAbstractValues && ! (obj instanceof can.List) &&
            obj instanceof can.Map) {
        event = '__values';
    }

    return __observe.call(this, obj, event);
};

// Use a tree so that items are sorted by the source list's
// index in O(log(n)) time
DerivedList = RBTreeList.extend({

    // A flag that determines if index influencing operations like shift
    // and splice should result in O(n) predicate evaluations
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

    init: function (sourceList, initializeWithoutItems) {

        var self = this;
        var initArgs = [];
        var initializeWithItems = !initializeWithoutItems;

        // Save a reference to the list we're deriving
        this._source = sourceList;

        // Don't populate the tree with the items initially passed
        // to the constructor
        if (initializeWithItems) {
            var initialItems = [];

            can.each(sourceList, function (value, index) {
                initialItems[index] = self.describeSourceItem(value, index);
            });

            initArgs[0] = initialItems;
            initArgs[1] = function (index, node) {
                initialItems[index].node = node;
            };
        }

        // Setup the tree
        RBTreeList.prototype.init.apply(this, initArgs);

        // Make this list a reflection of the source list
        this.syncAdds(! initializeWithItems);
        this.syncRemoves();
        this.syncValues();
    },

    syncAdds: function (addInitialItems) {

        var self = this;

        if (addInitialItems) {
            // Add initial items
            this._source.each(function (item, index) {
                self.addItem(item, index);
            });
        }

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
        var source = this._source;

        // Save a reference to the original `childrenOf`
        var childrenOf = can.bubble.childrenOf;

        // Prevent binding to changes on the grandchildren of the source
        can.bubble.childrenOf = function (parent) {
            if (parent === source) {
                childrenOf.apply(this, arguments);
            }
        };

        // Bind to "change" events on the source and its
        // immediate children
        source.bind('change', can.proxy(this._propagateChange, this));

        // Revert back to default `childrenOf`
        can.bubble.childrenOf = childrenOf;
    },

    _propagateChange: function (ev, attr, how, val, old) {
        var dotIndex = (""+attr).indexOf('.');
        var index = (dotIndex >= 0 ? attr.substr(0, dotIndex) : +attr);
        var node;

        // TODO: Make this work with child list "add"/"remove" events
        if (how !== 'set') {
            return;
        }

        // Find the node associated with the change at this index
        node = this.get(index);

        // If the change was to the source list, update our reference
        if (index === +attr) {
            node.data.value = val;
        }
        can.batch.trigger(this, '__nodes', [node.data]);
    },


    addItems: function (items, offset) {
        var self = this;

        can.each(items, function (item, i) {
            self.addItem(item, offset + i);
        });
    },

    addItem: function (item, insertIndex) {
        var node;
        var sourceItem = this.describeSourceItem.apply(this, arguments);

        // Don't dispatch the resulting "add" event until a reference
        // to the node has been saved to the `sourceItem` object
        can.batch.start();
        node = this.set(insertIndex, sourceItem, true);
        sourceItem.node = node;
        can.batch.stop();

        // Deal with the items after this inserted item that now
        // have a new index
        this._propagateInsert(insertIndex + 1);
    },

    describeSourceItem: function (item, insertIndex) {
        // Store information in a way that changes can be bound to
        var sourceItem = {};
        sourceItem.index = insertIndex;
        sourceItem.value = item;

        return sourceItem;
    },

    _propagateInsert: function (affectedIndex) {

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

            // Iterate using the linked-list, it's faster than...
            // `for (i) { this.get(i); }`
            while (node) {
                node.data.index = i;
                can.batch.trigger(this, '__nodes', [node.data]);
                node = node.next;
                i++;
            }
        }
    },

    removeItems: function (items, offset) {
        var self = this;

        // Remove each item
        can.each(items, function (item, i) {
            var index = offset + i;
            self.removeItem(item, index);
        });
    },

    removeItem: function (item, removedIndex) {
        this.unset(removedIndex, true);
        this._propagateInsert(removedIndex);
    },

    // Derived/filtered aren't writeable like traditional lists, they're
    // values are maintained via event bindings
    push: can.noop,
    pop: can.noop,
    shift: can.noop,
    unshift: can.noop,
    splice: can.noop,

    _printIndexesValue: function (node) {
        return node.data.value;
    }
});

// Handle the adding/removing of items to the derived list based on
// the predicate
FilteredList = DerivedList.extend({


    init: function (sourceList, predicate, predicateContext) {

        this._includeComputes = [];

        // Overwrite the default predicate if one is provided
        if (predicate) {
            this.predicate = can.proxy(predicate, predicateContext || this);
        }

        // Mark this derived list as bound to indexes
        if (predicate.length > 1) {
            this._indexBound = true;
        }

        // Set the default comparator value normalize method to use
        // the source tree
        this._normalizeComparatorValue = this._getNodeIndexFromSource;

        // Setup bindings, initialize the tree (but don't populate the tree
        // with the items passed to the constructor)
        DerivedList.prototype.init.apply(this, [sourceList, true]);
    },

    syncValues: function () {
        this._source.bind('__nodes',
            can.proxy(this._evaluateIncludeComputeManually, this));
    },

    _evaluateIncludeComputeManually: function (ev, sourceData) {
        var includeCompute = this._includeComputes[sourceData.index];

        if (! includeCompute) {
            return;
        }

        var oldValue = includeCompute.get();
        var newValue;

        includeCompute._on();
        newValue = includeCompute.get();

        if (newValue === oldValue) {
            return;
        }

        can.batch.trigger(includeCompute, {
            type: 'change',
            batchNum: can.batch.batchNum
        }, [
            newValue,
            oldValue
        ]);
    },

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

    _normalizeComparatorValue: function () {
        throw new Error(
            'A method must be provided to normalize comparator values');
    },

    // Use a function that refers to the source tree when the comparator
    // is passed a node
    _getNodeIndexFromSource: function (value) {
        return value instanceof this.Node ?
            this._source.indexOfNode(value.data.node) :
            value;
    },

    // Use a function that refers to this tree when the comparator
    // is passed a node
    _getNodeIndexFromSelf: function (value) {
        return value instanceof this.Node ?
            this.indexOfNode(value) :
            value;
    },

    // By default, include all items
    predicate: function () { return true; },

    // Bind to index/value and determine whether to include/exclude the item
    // based on the predicate function provided by the user
    addItem: function (node) {
        var self = this;
        var nodeValue = node.data;
        var observedPredicate = new ObservedPredicate(this.predicate,
            this._source._source, nodeValue);
        var includeCompute = observedPredicate.includeCompute;

        // Add the item to the list of computes so that it can be
        // referenced and called later on a "change" event
        this._includeComputes.splice(nodeValue.index, 0, includeCompute);

        // Listen to changes on the predicate result
        includeCompute.bind('change', function (ev, newVal) {
            self._applyPredicateResult(nodeValue, newVal);
        });

        // Get the compute's cached value
        var res = includeCompute.get();

        // Apply the initial predicate result only if it's true
        // because there is a smidge of overhead involved in getting
        // the source index
        if (res) {
            this._applyPredicateResult(nodeValue, true);
        }
    },

    _applyPredicateResult: function (nodeValue, include) {
        var sourceIndex = this._source.indexOfNode(nodeValue.node);

        if (include) {
            this.set(sourceIndex, nodeValue, true);
        } else {
            this.unset(sourceIndex, true);
        }
    },

    removeItem: function (item, sourceIndex) {
        // Attempt to remove a node from the filtered tree
        // using the source tree's index
        this.unset(sourceIndex, true);

        this._includeComputes.splice(sourceIndex, 1);
    },

    // Iterate over the sourceItems' values instead of the node's data
    each: function (callback) {
        RBTreeList.prototype.each.call(this, function (node, i) {
            return callback(node.data.value, i);
        });
    },


    ___get: function () {

        // Compare the passed index against the index of items in THIS tree
        this._normalizeComparatorValue = this._getNodeIndexFromSelf;

        var result = RBTreeList.prototype.___get.apply(this, arguments);

        // Revert back to the default behavior, which is to compare the passed
        // index against the index of items in the SOURCE tree
        this._normalizeComparatorValue = this._getNodeIndexFromSource;

        if (result instanceof this.Node) {
            result = result.data.value;
        }
        return result;
    },

    // The default RBTreeList add/remove/pre-remove events pass the Node
    // as the newVal/oldVal, but the derived list is publicly consumed by
    // lots of things that think it's can.List-like; Instead dispatch the
    // event with the Node's "value" compute value
    _triggerChange: function (attr, how, newVal, oldVal) {
        var nodeConstructor = this.Node;

        // Modify existing newVal/oldVal arrays values
        can.each([newVal, oldVal], function (newOrOldValues) {
            can.each(newOrOldValues, function (value, index) {
                if (value instanceof nodeConstructor) {
                    newOrOldValues[index] = value.data.value;
                }
            });
        });

        // Emit the event without any Node's as new/old values
        RBTreeList.prototype._triggerChange.apply(this, arguments);
    }
});

ObservedPredicate = function (predicate, sourceCollection, nodeValue) {
    this.predicate = predicate;
    this.nodeValue = nodeValue;
    this.sourceCollection = sourceCollection;
    this.includeCompute = new can.Compute(this.includeFn, this);
};

// Determine whether to include this item in the tree or not
ObservedPredicate.prototype.includeFn = function () {
    var include, index, sourceCollection, value;

    index = this.nodeValue.index;
    value = this.nodeValue.value;
    sourceCollection = this.sourceCollection;

    // Enable sloppy map binds
    __observeAbstractValues = true;

    // Disregard bindings to the source item because the
    // source list's change event binding will handle this
    __observeException = value;

    // Point to our custom __observe definition that can be
    // configured to work differently
    can.__observe = __predicateObserve;

    // Use the predicate function to determine if this
    // item should be included in the overall list
    include = this.predicate(value, index, sourceCollection);

    // Turn off sloppy map binds
    __observeAbstractValues = false;

    // Remove the exception
    __observeException = undefined;

    // Revert to default can.__observe method
    can.__observe = __observe;

    return include;
};

// Overwrite the default `.filter()` method with our derived list filter
// method
FilterPluginList = List.extend({
    filter: DerivedList.prototype.filter
});

// Register the modified RBTreeList to the `can` namespace
if (typeof window !== 'undefined' && !require.resolve && window.can) {
    window.can.DeriveList = FilterPluginList;
}

module.exports = FilterPluginList;