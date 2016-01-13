var RBTreeList = require('can-binarytree').RBTreeList;
require('can/list/list');
require('can/compute/compute');
require('can/util/util');

var __observe = can.__observe;
var __observeAbstractValues = false;
var _triggerChange, __observeException, __predicateObserve,
    DerivedList, FilteredList, ObservedPredicate;


// Dispatch a `__modified` event alongside all other `can.Map` events as
// a non-recursive alternative to `change` events
_triggerChange = can.Map.prototype._triggerChange;
can.Map.prototype._triggerChange = function (attr, how, newVal, oldVal) {
    _triggerChange.apply(this, arguments);

    can.batch.trigger(this, {
        type: '__modified',
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
        event = '__modified';
    }

    return __observe.call(this, obj, event);
};

var eachNodesOrItems = function (source, iterator, context) {
    if (source instanceof can.RBTreeList) {
        return source.eachNode(iterator, context);
    } else {
        return can.each.apply(can.each, arguments);
    }
};

// Use a tree so that items are sorted by the source list's
// index in O(log(n)) time
DerivedList = RBTreeList.extend({

    // A flag that determines if index influencing operations like shift
    // and splice should result in O(n) predicate evaluations
    _indexBound: false,

    dFilter: function (predicate, predicateContext) {
        var context = this;
        var filteredList;

        can.__notObserve(function () {

            if (! context._derivedList) {
                context._derivedList = new DerivedList(context);
            }

            filteredList = new FilteredList(context._derivedList, predicate,
                predicateContext);

            // Set _indexBound to true if this filtered list depends on the
            // index. Once set to true there's no going back.
            if (! context._derivedList._indexBound &&
                    filteredList._indexBound) {
                context._derivedList._indexBound = true;
            }

        })();

        return filteredList;
    },

    setup: function () {

        var setupResult = RBTreeList.prototype.setup.apply(this, arguments);

        // CanJS 3.0
        if (this.___get) {
            this.___get = this.____get;

        // CanJS 2.2.9
        } else {
            this.__get = this.____get;
        }

        return setupResult;
    },

    init: function (sourceList, initializeWithoutItems) {

        var context = this;
        var initArgs = [];
        var initializeWithItems = !initializeWithoutItems;

        // Save a reference to the list we're deriving
        this._source = sourceList;

        // Don't populate the tree with the items initially passed
        // to the constructor
        if (initializeWithItems) {
            var initialItems = [];

            // `sourceList` can be either a native JS array, a `can.List, or
            // a `can.RBTreeList`, thus the `can.each` and not
            // `sourceList.each`
            can.each(sourceList, function (value, index) {
                initialItems[index] = context.describeSourceItem(value, index);
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
            this.addItems(this._source, 0);
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

        var tree = this;

        // Handle the re-assigment of index values
        var ___set = this._source.___set;
        this._source.___set = function (index, value) {

            var node = tree.get(index);

            if (node) {
                node.data.index = index;
                node.data.value = value;
                can.batch.trigger(tree, '__nodeModified', [node]);
            }

            // Continue the `set` on the source list
            return ___set.apply(this, arguments);
        };
    },

    addItems: function (items, offset) {
        var self = this;

        eachNodesOrItems(items, function (item, i) {
            self.addItem(item, offset + i);
        });
    },

    addItem: function (item, insertIndex) {
        var context = this;
        var sourceItem = this.describeSourceItem.apply(this, arguments);
        var node;

        // Don't dispatch the resulting "add" event until a reference
        // to the node has been saved to the `sourceItem` object
        can.batch.start();

        node = this.set(insertIndex, sourceItem, true);
        sourceItem.node = node;

        // Deal with the items after this inserted item that now
        // have a new index
        context._propagateIndexShift(insertIndex + 1);

        // Stop batching once all of the events have been queued
        can.batch.stop();
    },

    describeSourceItem: function (item, insertIndex) {
        var tree = this;

        // Store information in a way that changes can be bound to
        var sourceItem = {};
        sourceItem.index = insertIndex;
        sourceItem.value = item;

        if (item.bind) {
            item.bind('__modified', function () {
                can.batch.trigger(tree, '__nodeModified', [sourceItem.node]);
            });
        }

        return sourceItem;
    },

    _propagateIndexShift: function (affectedIndex) {

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
                can.batch.trigger(this, '__nodeModified', [node]);
                node = node.next;
                i++;
            }
        }
    },

    removeItems: function (items, offset) {
        var index = (items.length && items.length - 1) + offset;

        // Remove each item
        while (index >= offset) {
            this.removeItem(items[index], index);
            index--;
        }
    },

    removeItem: function (item, removedIndex) {
        this.unset(removedIndex, true);
        this._propagateIndexShift(removedIndex);
    },

    // Derived/filtered aren't writeable like traditional lists, they're
    // values are maintained via event bindings
    push: can.noop,
    pop: can.noop,
    shift: can.noop,
    unshift: can.noop,
    splice: can.noop,
    removeAttr: can.noop,

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
        this._source.bind('__nodeModified',
            can.proxy(this._evaluateIncludeComputeManually, this));
    },

    _evaluateIncludeComputeManually: function (ev, node) {
        var sourceData = node.data;
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
        // referenced and called later if the item is modified
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
        RBTreeList.prototype.eachNode.call(this, function (node, i) {
            return callback(node.data.value, i);
        });
    },


    ____get: function () {

        // Compare the passed index against the index of items in THIS tree
        this._normalizeComparatorValue = this._getNodeIndexFromSelf;

        var result = RBTreeList.prototype.____get.apply(this, arguments);

        // Revert back to the default behavior, which is to compare the passed
        // index against the index of items in the SOURCE tree
        this._normalizeComparatorValue = this._getNodeIndexFromSource;

        if (result && typeof result === 'object' && 'value' in result) {
            result = result.value;
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

// Add our unique filter method to the can.List prototype
can.List.prototype.dFilter = DerivedList.prototype.dFilter;

module.exports = DerivedList;