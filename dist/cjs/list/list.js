/*list/list*/
var List = require('can/list/list');
var RBTreeList = require('can-binarytree').RBTreeList;
require('can/compute/compute');
require('can/util/util');
var __observe = can.__observe;
var __observeAbstractValues = false;
var _triggerChange, __observeException, __predicateObserve, DerivedList, FilteredList, FilterPluginList, ObservedPredicate;
_triggerChange = can.Map.prototype._triggerChange;
can.Map.prototype._triggerChange = function (attr, how, newVal, oldVal) {
    _triggerChange.apply(this, arguments);
    can.batch.trigger(this, {
        type: '__values',
        target: this
    }, [
        newVal,
        oldVal
    ]);
};
__predicateObserve = function (obj, event) {
    if (obj === __observeException) {
        return;
    }
    if (__observeAbstractValues && !(obj instanceof can.List) && obj instanceof can.Map) {
        event = '__values';
    }
    return __observe.call(this, obj, event);
};
DerivedList = RBTreeList.extend({
    _indexBound: false,
    filter: function (predicate, predicateContext) {
        if (!this._derivedList) {
            this._derivedList = new DerivedList(this);
        }
        var filteredList = new FilteredList(this._derivedList, predicate, predicateContext);
        if (!this._derivedList._indexBound && filteredList._indexBound) {
            this._derivedList._indexBound = true;
        }
        return filteredList;
    },
    init: function (sourceList, initializeWithoutItems) {
        var self = this;
        var initArgs = [];
        var initializeWithItems = !initializeWithoutItems;
        this._source = sourceList;
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
        RBTreeList.prototype.init.apply(this, initArgs);
        this.syncAdds(!initializeWithItems);
        this.syncRemoves();
        this.syncValues();
    },
    syncAdds: function (addInitialItems) {
        var self = this;
        if (addInitialItems) {
            this._source.each(function (item, index) {
                self.addItem(item, index);
            });
        }
        this._source.bind('add', function (ev, items, offset) {
            self.addItems(items, offset);
        });
    },
    syncRemoves: function () {
        var self = this;
        this._source.bind('remove', function (ev, items, offset) {
            self.removeItems(items, offset);
        });
    },
    syncValues: function () {
        var source = this._source;
        var childrenOf = can.bubble.childrenOf;
        can.bubble.childrenOf = function (parent) {
            if (parent === source) {
                childrenOf.apply(this, arguments);
            }
        };
        source.bind('change', can.proxy(this._propagateChange, this));
        can.bubble.childrenOf = childrenOf;
    },
    _propagateChange: function (ev, attr, how, val, old) {
        var dotIndex = ('' + attr).indexOf('.');
        var index = dotIndex >= 0 ? attr.substr(0, dotIndex) : +attr;
        var node;
        if (how !== 'set') {
            return;
        }
        node = this.get(index);
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
        can.batch.start();
        node = this.set(insertIndex, sourceItem, true);
        sourceItem.node = node;
        can.batch.stop();
        this._propagateInsert(insertIndex + 1);
    },
    describeSourceItem: function (item, insertIndex) {
        var sourceItem = {};
        sourceItem.index = insertIndex;
        sourceItem.value = item;
        return sourceItem;
    },
    _propagateInsert: function (affectedIndex) {
        var i, node;
        if (this._indexBound) {
            i = affectedIndex;
            node = this.get(i);
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
        can.each(items, function (item, i) {
            var index = offset + i;
            self.removeItem(item, index);
        });
    },
    removeItem: function (item, removedIndex) {
        this.unset(removedIndex, true);
        this._propagateInsert(removedIndex);
    },
    push: can.noop,
    pop: can.noop,
    shift: can.noop,
    unshift: can.noop,
    splice: can.noop,
    _printIndexesValue: function (node) {
        return node.data.value;
    }
});
FilteredList = DerivedList.extend({
    init: function (sourceList, predicate, predicateContext) {
        this._includeComputes = [];
        if (predicate) {
            this.predicate = can.proxy(predicate, predicateContext || this);
        }
        if (predicate.length > 1) {
            this._indexBound = true;
        }
        this._normalizeComparatorValue = this._getNodeIndexFromSource;
        DerivedList.prototype.init.apply(this, [
            sourceList,
            true
        ]);
    },
    syncValues: function () {
        this._source.bind('__nodes', can.proxy(this._evaluateIncludeComputeManually, this));
    },
    _evaluateIncludeComputeManually: function (ev, sourceData) {
        var includeCompute = this._includeComputes[sourceData.index];
        if (!includeCompute) {
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
        this._source.bind('pre-remove', function (ev, items, offset) {
            self.removeItems(items, offset);
        });
    },
    _gapAndSize: function () {
        this.length++;
    },
    _comparator: function (_a, _b) {
        var a = this._normalizeComparatorValue(_a);
        var b = this._normalizeComparatorValue(_b);
        return a === b ? 0 : a < b ? -1 : 1;
    },
    _normalizeComparatorValue: function () {
        throw new Error('A method must be provided to normalize comparator values');
    },
    _getNodeIndexFromSource: function (value) {
        return value instanceof this.Node ? this._source.indexOfNode(value.data.node) : value;
    },
    _getNodeIndexFromSelf: function (value) {
        return value instanceof this.Node ? this.indexOfNode(value) : value;
    },
    predicate: function () {
        return true;
    },
    addItem: function (node) {
        var self = this;
        var nodeValue = node.data;
        var observedPredicate = new ObservedPredicate(this.predicate, this._source._source, nodeValue);
        var includeCompute = observedPredicate.includeCompute;
        this._includeComputes.splice(nodeValue.index, 0, includeCompute);
        includeCompute.bind('change', function (ev, newVal) {
            self._applyPredicateResult(nodeValue, newVal);
        });
        var res = includeCompute.get();
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
        this.unset(sourceIndex, true);
        this._includeComputes.splice(sourceIndex, 1);
    },
    each: function (callback) {
        RBTreeList.prototype.each.call(this, function (node, i) {
            return callback(node.data.value, i);
        });
    },
    ___get: function () {
        this._normalizeComparatorValue = this._getNodeIndexFromSelf;
        var result = RBTreeList.prototype.___get.apply(this, arguments);
        this._normalizeComparatorValue = this._getNodeIndexFromSource;
        if (result instanceof this.Node) {
            result = result.data.value;
        }
        return result;
    },
    _triggerChange: function (attr, how, newVal, oldVal) {
        var nodeConstructor = this.Node;
        can.each([
            newVal,
            oldVal
        ], function (newOrOldValues) {
            can.each(newOrOldValues, function (value, index) {
                if (value instanceof nodeConstructor) {
                    newOrOldValues[index] = value.data.value;
                }
            });
        });
        RBTreeList.prototype._triggerChange.apply(this, arguments);
    }
});
ObservedPredicate = function (predicate, sourceCollection, nodeValue) {
    this.predicate = predicate;
    this.nodeValue = nodeValue;
    this.sourceCollection = sourceCollection;
    this.includeCompute = new can.Compute(this.includeFn, this);
};
ObservedPredicate.prototype.includeFn = function () {
    var include, index, sourceCollection, value;
    index = this.nodeValue.index;
    value = this.nodeValue.value;
    sourceCollection = this.sourceCollection;
    __observeAbstractValues = true;
    __observeException = value;
    can.__observe = __predicateObserve;
    include = this.predicate(value, index, sourceCollection);
    __observeAbstractValues = false;
    __observeException = undefined;
    can.__observe = __observe;
    return include;
};
FilterPluginList = List.extend({ filter: DerivedList.prototype.filter });
if (typeof window !== 'undefined' && !require.resolve && window.can) {
    window.can.DeriveList = FilterPluginList;
}
module.exports = FilterPluginList;