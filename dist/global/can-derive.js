/*[global-shim-start]*/
(function (exports, global){
	var origDefine = global.define;

	var get = function(name){
		var parts = name.split("."),
			cur = global,
			i;
		for(i = 0 ; i < parts.length; i++){
			if(!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var modules = (global.define && global.define.modules) ||
		(global._define && global._define.modules) || {};
	var ourDefine = global.define = function(moduleName, deps, callback){
		var module;
		if(typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for(i =0; i < deps.length; i++) {
			args.push( exports[deps[i]] ? get(exports[deps[i]]) : ( modules[deps[i]] || get(deps[i]) )  );
		}
		// CJS has no dependencies but 3 callback arguments
		if(!deps.length && callback.length) {
			module = { exports: {} };
			var require = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args.push(require, module.exports, module);
		}
		// Babel uses the exports and module object.
		else if(!args[0] && deps[0] === "exports") {
			module = { exports: {} };
			args[0] = module.exports;
			if(deps[1] === "module") {
				args[1] = module;
			}
		} else if(!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		modules[moduleName] = module && module.exports ? module.exports : result;
	};
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function(){
		// shim for @@global-helpers
		var noop = function(){};
		return {
			get: function(){
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load){
				eval("(function() { " + __load.source + " \n }).call(global);");
			}
		};
	});
})({},window)
/*list/list*/
define('can-derive/list/list', function (require, exports, module) {
    var List = require('can/list/list');
    var RBTreeList = require('can-binarytree').RBTreeList;
    var DerivedList, FilteredList;
    require('can/compute/compute');
    require('can/util/util');
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
        init: function (sourceList) {
            var args = can.makeArray(arguments);
            this._source = sourceList;
            RBTreeList.prototype.init.apply(this, args.slice(1));
            this.syncAdds();
            this.syncRemoves();
            this.syncValues();
        },
        syncAdds: function () {
            var self = this;
            this._source.each(function (item, index) {
                self.addItem(item, index);
            });
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
            var self = this;
            var ___set = this._source.___set;
            this._source.___set = function (index, value) {
                var computes = self.get(index).data;
                if (computes) {
                    computes.value(value);
                }
                return ___set.apply(this, arguments);
            };
        },
        addItems: function (items, offset) {
            var self = this;
            can.each(items, function (item, i) {
                self.addItem(item, offset + i);
            });
        },
        addItem: function (item, insertIndex) {
            var node;
            var computes = {};
            computes.index = can.compute(insertIndex);
            computes.value = can.compute(item);
            can.batch.start();
            node = this.set(insertIndex, computes, true);
            computes.node = node;
            can.batch.stop();
            this.propagateIndexAdjustment(insertIndex + 1);
        },
        propagateIndexAdjustment: function (affectedIndex) {
            var i, node;
            if (this._indexBound) {
                i = affectedIndex;
                node = this.get(i);
                while (node) {
                    node.data.index(i);
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
            this.propagateIndexAdjustment(removedIndex);
        },
        push: can.noop,
        pop: can.noop,
        shift: can.noop,
        unshift: can.noop,
        splice: can.noop,
        _printIndexesValue: function (node) {
            return node.data.value();
        }
    });
    FilteredList = DerivedList.extend({
        init: function (sourceList, predicate, predicateContext) {
            if (predicate) {
                this.predicate = can.proxy(predicate, predicateContext || this);
            }
            if (predicate.length > 1) {
                this._indexBound = true;
            }
            this._normalizeComparatorValue = this._getNodeIndexFromSource;
            DerivedList.prototype.init.call(this, sourceList);
        },
        syncValues: can.noop,
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
            var computes = node.data;
            var initialized = can.compute(false);
            var include = can.compute(function () {
                    var index, sourceCollection, value;
                    if (!initialized()) {
                        return false;
                    }
                    value = computes.value();
                    sourceCollection = this._source._source;
                    if (this._indexBound) {
                        index = computes.index();
                    }
                    if (this.predicate.length > 2) {
                        sourceCollection.attr('length');
                    }
                    return this.predicate(value, index, sourceCollection);
                }, this);
            include.bind('change', function (ev, newVal, oldVal) {
                var sourceIndex = self._source.indexOfNode(computes.node);
                if (newVal) {
                    self.set(sourceIndex, computes, true);
                } else {
                    self.unset(sourceIndex, true);
                }
            });
            initialized(true);
        },
        removeItem: function (item, sourceIndex) {
            this.unset(sourceIndex, true);
        },
        each: function (callback) {
            RBTreeList.prototype.each.call(this, function (node, i) {
                return callback(node.data.value(), i);
            });
        },
        ___get: function () {
            this._normalizeComparatorValue = this._getNodeIndexFromSelf;
            var result = RBTreeList.prototype.___get.apply(this, arguments);
            this._normalizeComparatorValue = this._getNodeIndexFromSource;
            if (result instanceof this.Node) {
                result = result.data.value();
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
                        newOrOldValues[index] = value.data.value();
                    }
                });
            });
            RBTreeList.prototype._triggerChange.apply(this, arguments);
        }
    });
    var FilterPluginList = List.extend({ filter: DerivedList.prototype.filter });
    module.exports = FilterPluginList;
});
/*can-derive@0.0.3#can-derive*/
define('can-derive', function (require, exports, module) {
    var List = require('can-derive/list/list');
    if (typeof window !== 'undefined' && !require.resolve && window.can) {
        window.can.DeriveList = List;
    }
    module.exports = { List: List };
});
/*[global-shim-end]*/
(function (){
	window._define = window.define;
	window.define = window.define.orig;
})();