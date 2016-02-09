var Benchmark = require('benchmark');
var can = require('can');
var diff = require('can/util/array/diff.js');

require("./list");
require('can/view/autorender/autorender');

var appState;

/**
 * Utilites - Referenced by benchmarks
 **/

var utils = {
    sandboxEl: document.getElementById('sandbox'),
    virtualDom: window.require("virtual-dom"),
    makeItem: function (index) {
        return {
            id: 'todo-' + index,
            completed: true
        };
    },
    makeArray: function (length) {
        var a = [];
        for (var i = 0; i < length; i++) {
            a.push(this.makeItem(i));
        }
        return a;
    },
    makePredicateFn: function () {
        return function (item) {
            return ((item.attr ? item.attr('completed') : item.completed) === true);
        };
    }
};

/**
 * Core - Benchmarks
 **/

// Define default values
var ResultMap = can.Map.extend({
    define: {
        nativePopulate: {
            value: '-'
        },
        derivePopulate: {
            value: '-'
        },
        nativeUpdate: {
            value: '-'
        },
        deriveUpdate: {
            value: '-'
        },
        virtualDomUpdate: {
            value: '-'
        },
        deriveDomUpdate: {
            value: '-'
        },
        reducedNativeUpdate: {
            value: '-'
        },
        reducedDeriveUpdate: {
            value: '-'
        },
        reducedNativeDomUpdate: {
            value: '-'
        },
        reducedDeriveDomUpdate: {
            value: '-'
        },
        nativeBatchUpdate: {
            value: '-'
        },
        deriveBatchUpdate: {
            value: '-'
        }
    }
});

var testResults = new can.List([
    new ResultMap({ numberOfItems: 1 }),
    new ResultMap({ numberOfItems: 10 }),
    new ResultMap({ numberOfItems: 100 }),
    new ResultMap({ numberOfItems: 1000 }),
    new ResultMap({ numberOfItems: 10000 }),
    new ResultMap({ numberOfItems: 100000 }),
]);

var benchmarkSuite = new Benchmark.Suite('can.derive.List.dFilter')
    .on('cycle', function (ev) {
        var benchmark = ev.target;
        var averageMs = benchmark.stats.mean * 1000;

        console.log(benchmark.toString() +
            ' [Avg runtime: ' + averageMs + ']');

        benchmark.results.attr(benchmark.key, averageMs);
    });

var setupBenchmarks = function () {
    testResults.each(function (results) {

        if (appState.attr('options.runNativePopulate')) {
            benchmarkSuite.add(can.extend({
                results: results,
                key: 'nativePopulate',
                name: 'Native populate (' + results.numberOfItems + ' items)',
                setup: function () {
                    /* jshint ignore:start */

                    var numberOfItems = this.results.attr('numberOfItems');
                    var source = this.makeArray(numberOfItems);

                    /* jshint ignore:end */
                },
                fn: function () {
                    /* jshint ignore:start */

                    var filtered = source.filter(this.makePredicateFn());

                    if (filtered.length !== numberOfItems) {
                        throw 'Bad result';
                    }

                    /* jshint ignore:end */
                }
            }, utils));

        }

        if (appState.attr('options.runDerivePopulate')) {
            benchmarkSuite.add(can.extend({
                results: results,
                key: 'derivePopulate',
                name: 'Derived populate (' + results.numberOfItems + ' items)',
                setup: function () {
                    /* jshint ignore:start */

                    var numberOfItems = this.results.attr('numberOfItems');
                    var values = this.makeArray(numberOfItems);

                    var source = new can.List();

                    values.forEach(function (element) {
                        source.push(element);
                    });

                    /* jshint ignore:end */
                },
                fn: function () {
                    /* jshint ignore:start */

                    var filtered = source.dFilter(this.makePredicateFn());

                    if (filtered.attr('length') !== numberOfItems) {
                        throw 'Bad result';
                    }

                    // Unbind from the source list so that next
                    // filter starts from scratch
                    source._derivedList.unbindFromSource();

                    /* jshint ignore:end */
                }
            }, utils));
        }

        if (appState.attr('options.runNativeUpdate')) {
            benchmarkSuite.add(can.extend({
                results: results,
                key: 'nativeUpdate',
                name: 'Native update (' + results.numberOfItems + ' items)',
                diff: diff,
                setup: function () {
                    /* jshint ignore:start */

                    var numberOfItems = this.results.attr('numberOfItems');
                    var source = this.makeArray(numberOfItems);
                    var updateIndex = numberOfItems - 1;
                    var element = source[updateIndex];

                    /* jshint ignore:end */
                },
                fn: function () {
                    /* jshint ignore:start */

                    // Update
                    element.completed = ! element.completed;
                    var filtered = source.filter(this.makePredicateFn());

                    if (filtered.length !== numberOfItems - 1) {
                        throw 'Bad result';
                    }

                    // Restore
                    element.completed = ! element.completed;
                    filtered = source.filter(this.makePredicateFn());

                    if (filtered.length !== numberOfItems) {
                        throw 'Bad result';
                    }

                    /* jshint ignore:end */
                }
            }, utils));
        }

        if (appState.attr('options.runDeriveUpdate')) {
            benchmarkSuite.add(can.extend({
                results: results,
                key: 'deriveUpdate',
                name: 'Derived update (' + results.numberOfItems + ' items)',
                setup: function () {
                    /* jshint ignore:start */

                    var numberOfItems = this.results.attr('numberOfItems');
                    var values = this.makeArray(numberOfItems);
                    var source = new can.List();

                    values.forEach(function (element) {
                        source.push(element);
                    });

                    var updateIndex = source.attr('length') - 1;
                    var element = source.attr(updateIndex);
                    var filtered = source.dFilter(this.makePredicateFn());

                    /* jshint ignore:end */
                },
                fn: function () {
                    /* jshint ignore:start */

                    // Update
                    element.attr('completed', ! element.attr('completed'));

                    if (filtered.attr('length') !== numberOfItems - 1) {
                        throw 'Bad result';
                    }

                    // Restore
                    element.attr('completed', ! element.attr('completed'));

                    if (filtered.attr('length') !== numberOfItems) {
                        throw 'Bad result';
                    }

                    /* jshint ignore:end */
                }
            }, utils));
        }

        if (appState.attr('options.runVirtualDomUpdate')) {
            benchmarkSuite.add(can.extend({
                results: results,
                key: 'virtualDomUpdate',
                name: 'Virtual DOM update (' + results.numberOfItems + ' items)',
                render: function (filtered) {
                    var h = this.virtualDom.h;
                    return h('ul', {}, filtered.map(function (element) {
                        return h("li", { key: element.id }, []);
                    }));
                },
                updateDom: function (filtered) {
                    /* jshint ignore:start */

                    var newTree = this.render(filtered);
                    var patches = this.virtualDom.diff(this.tree, newTree)

                    this.virtualDom.patch(this.rootNode, patches);
                    this.tree = newTree;

                    /* jshint ignore:end */
                },
                setup: function () {
                    /* jshint ignore:start */

                    var numberOfItems = this.results.attr('numberOfItems');
                    var source = this.makeArray(numberOfItems);
                    var predicateFn = this.makePredicateFn();
                    var filtered = source.filter(predicateFn);
                    var updateIndex = numberOfItems - 1;
                    var element = source[updateIndex];

                    this.tree = this.render(filtered);
                    this.rootNode = this.virtualDom.create(this.tree);

                    $(this.sandboxEl).html(this.rootNode);

                    /* jshint ignore:end */
                },
                fn: function () {
                    /* jshint ignore:start */

                    // Update
                    element.completed = ! element.completed;
                    var filtered = source.filter(predicateFn);
                    this.updateDom(filtered);

                    if (filtered.length !== numberOfItems - 1) {
                        throw 'Bad result';
                    }

                    // Restore
                    element.completed = ! element.completed;
                    filtered = source.filter(predicateFn);
                    this.updateDom(filtered);

                    if (filtered.length !== numberOfItems) {
                        throw 'Bad result';
                    }

                    /* jshint ignore:end */
                },
                teardown: function () {
                    $(this.sandboxEl).empty();
                }
            }, utils));
        }

        if (appState.attr('options.runDeriveDomUpdate')) {
            benchmarkSuite.add(can.extend({
                results: results,
                key: 'deriveDomUpdate',
                name: 'Derived DOM update (' + results.numberOfItems + ' items)',
                // onCycle: function (ev) { debugger; },
                setup: function () {
                    /* jshint ignore:start */

                    var numberOfItems = this.results.attr('numberOfItems');
                    var values = this.makeArray(numberOfItems);
                    var source = new can.List();

                    values.forEach(function (element) {
                        source.push(element);
                    });

                    var updateIndex = source.attr('length') - 1;
                    var element = source.attr(updateIndex);
                    var filtered = source.dFilter(this.makePredicateFn());

                    var renderer = can.stache(
                        "<ul>\n{{#each filtered}}\n<li></li>\n{{/each}}\n</ul>");

                    var state = new can.Map({
                        filtered: filtered
                    });
                    var fragment = renderer(state);

                    // $(this.sandboxEl).html(fragment);
                    this.sandboxEl.appendChild(fragment);


                    /* jshint ignore:end */
                },
                fn: function () {
                    /* jshint ignore:start */

                    // Update
                    console.time('update')
                    element.attr('completed', ! element.attr('completed'));

                    if (filtered.attr('length') !== numberOfItems - 1) {
                        throw 'Bad result';
                    }

                    // Restore
                    element.attr('completed', ! element.attr('completed'));
                    console.timeEnd('update')
                    if (filtered.attr('length') !== numberOfItems) {
                        throw 'Bad result';
                    }
                    /* jshint ignore:end */
                },
                teardown: function () {
                    /* jshint ignore:start */

                    // $(this.sandboxEl).empty();
                    this.sandboxEl.innerHTML = '';

                    state.attr('filtered', []);
                    source.splice(0, source.attr('length') - 1);
                    filtered._source.unbindFromSource();
                    filtered._source.__bindEvents = {};
                    filtered._source._bindings = 0;
                    filtered.unbindFromSource();
                    filtered.__bindEvents = {};
                    filtered._bindings = 0;
                    source.__bindEvents = {};
                    source._bindings = 0;

                    // Remove the reference in the DOM that ties back to the
                    // last filtered/source list
                    /* jshint ignore:end */
                }
            }, utils));
        }


        if (appState.attr('options.runReducedNativeUpdate')) {
            benchmarkSuite.add(can.extend({
                results: results,
                key: 'reducedNativeUpdate',
                name: 'Reduced Native update (' + results.numberOfItems + ' items)',
                diff: diff,
                setup: function () {
                    /* jshint ignore:start */

                    var numberOfItems = 100000;
                    var filteredCount = this.results.attr('numberOfItems');
                    var source = this.makeArray(numberOfItems);

                    source.forEach(function (element, index) {
                        if (index < filteredCount) {
                            element.completed = true;
                        } else {
                            element.completed = false;
                        }
                    });

                    var element = source[numberOfItems - 1];

                    /* jshint ignore:end */
                },
                fn: function () {
                    /* jshint ignore:start */

                    // Update
                    element.completed = ! element.completed;
                    var filtered = source.filter(this.makePredicateFn());

                    if (filtered.length !== filteredCount + (element.completed ? 1 : -1)) {
                        throw 'Bad result';
                    }

                    // Restore
                    element.completed = ! element.completed;
                    filtered = source.filter(this.makePredicateFn());

                    if (filtered.length !== filteredCount) {
                        throw 'Bad result';
                    }

                    /* jshint ignore:end */
                }
            }, utils));
        }

        if (appState.attr('options.runReducedDeriveUpdate')) {
            benchmarkSuite.add(can.extend({
                results: results,
                key: 'reducedDeriveUpdate',
                name: 'Reduced Derived update (' + results.numberOfItems + ' items)',
                setup: function () {
                    /* jshint ignore:start */

                    var numberOfItems = 100000;
                    var filteredCount = this.results.attr('numberOfItems');
                    var values = this.makeArray(numberOfItems);
                    var source = new can.List();


                    values.forEach(function (element, index) {
                        if (index < filteredCount) {
                            element.completed = true;
                        } else {
                            element.completed = false;
                        }

                        source.push(element);
                    });

                    var element = source.attr(numberOfItems - 1);
                    var filtered = source.dFilter(this.makePredicateFn());

                    /* jshint ignore:end */
                },
                fn: function () {
                    /* jshint ignore:start */

                    // Update
                    element.attr('completed', ! element.attr('completed'));

                    if (filtered.attr('length') !== filteredCount + (element.attr('completed') ? 1 : -1)) {
                        throw 'Bad result';
                    }

                    // Restore
                    element.attr('completed', ! element.attr('completed'));

                    if (filtered.attr('length') !== filteredCount) {
                        throw 'Bad result';
                    }

                    /* jshint ignore:end */
                }
            }, utils));
        }

        if (appState.attr('options.runReducedNativeDomUpdate')) {
            benchmarkSuite.add(can.extend({
                results: results,
                key: 'reducedNativeDomUpdate',
                name: 'Reduced Native DOM update (' + results.numberOfItems + ' items)',
                diff: diff,
                render: function (filtered) {
                    var h = this.virtualDom.h;
                    return h('ul', {}, filtered.map(function (element) {
                        return h("li", { key: element.id }, []);
                    }));
                },
                updateDom: function (filtered) {
                    /* jshint ignore:start */

                    var newTree = this.render(filtered);
                    var patches = this.virtualDom.diff(this.tree, newTree)

                    this.virtualDom.patch(this.rootNode, patches);
                    this.tree = newTree;

                    /* jshint ignore:end */
                },
                setup: function () {
                    /* jshint ignore:start */

                    var numberOfItems = 10000;
                    var filteredCount = this.results.attr('numberOfItems');
                    var source = this.makeArray(numberOfItems);

                    source.forEach(function (element, index) {
                        if (index < filteredCount) {
                            element.completed = true;
                        } else {
                            element.completed = false;
                        }
                    });

                    var filtered = source.filter(this.makePredicateFn());
                    var element = source[numberOfItems - 1];


                    this.tree = this.render(filtered);
                    this.rootNode = this.virtualDom.create(this.tree);

                    $(this.sandboxEl).html(this.rootNode);


                    /* jshint ignore:end */
                },
                fn: function () {
                    /* jshint ignore:start */

                    // Update
                    element.completed = ! element.completed;
                    filtered = source.filter(this.makePredicateFn());
                    this.updateDom(filtered);

                    if (filtered.length !== filteredCount + (element.completed ? 1 : -1)) {
                        throw 'Bad result';
                    }

                    // Restore
                    element.completed = ! element.completed;
                    filtered = source.filter(this.makePredicateFn());
                    this.updateDom(filtered);

                    if (filtered.length !== filteredCount) {
                        throw 'Bad result';
                    }

                    /* jshint ignore:end */
                },
                teardown: function () {
                    $(this.sandboxEl).empty();
                }
            }, utils));
        }

        if (appState.attr('options.runReducedDeriveDomUpdate')) {
            benchmarkSuite.add(can.extend({
                results: results,
                key: 'reducedDeriveDomUpdate',
                name: 'Reduced Derived DOM update (' + results.numberOfItems + ' items)',
                setup: function () {
                    /* jshint ignore:start */

                    var numberOfItems = 10000;
                    var filteredCount = this.results.attr('numberOfItems');
                    var values = this.makeArray(numberOfItems);
                    var source = new can.List();


                    values.forEach(function (element, index) {
                        if (index < filteredCount) {
                            element.completed = true;
                        } else {
                            element.completed = false;
                        }

                        source.push(element);
                    });

                    var element = source.attr(numberOfItems - 1);
                    var filtered = source.dFilter(this.makePredicateFn());

                    var renderer = can.stache(
                        "<ul>\n{{#each filtered}}\n<li></li>\n{{/each}}\n</ul>");

                    var state = new can.Map({
                        filtered: filtered
                    });
                    var fragment = renderer(state);

                    // $(this.sandboxEl).html(fragment);
                    this.sandboxEl.appendChild(fragment);

                    /* jshint ignore:end */
                },
                fn: function () {
                    /* jshint ignore:start */

                    // Update
                    element.attr('completed', ! element.attr('completed'));

                    if (filtered.attr('length') !== filteredCount + (element.attr('completed') ? 1 : -1)) {
                        throw 'Bad result';
                    }

                    // Restore
                    element.attr('completed', ! element.attr('completed'));

                    if (filtered.attr('length') !== filteredCount) {
                        throw 'Bad result';
                    }

                    /* jshint ignore:end */
                },
                teardown: function () {
                    /* jshint ignore:start */

                    // $(this.sandboxEl).empty();
                    this.sandboxEl.innerHTML = '';

                    state.attr('filtered', []);
                    source.splice(0, source.attr('length') - 1);
                    filtered._source.unbindFromSource();
                    filtered._source.__bindEvents = {};
                    filtered._source._bindings = 0;
                    filtered.unbindFromSource();
                    filtered.__bindEvents = {};
                    filtered._bindings = 0;
                    source.__bindEvents = {};
                    source._bindings = 0;

                    // Remove the reference in the DOM that ties back to the
                    // last filtered/source list
                    /* jshint ignore:end */
                }
            }, utils));
        }

        if (appState.attr('options.runNativeBatchUpdate')) {
            benchmarkSuite.add(can.extend({
                results: results,
                key: 'nativeBatchUpdate',
                name: 'Native batch update (' + results.numberOfItems + ' items)',
                diff: diff,
                setup: function () {
                    /* jshint ignore:start */

                    var numberOfItems = 100000;
                    var batchCount = this.results.attr('numberOfItems');
                    var source = this.makeArray(numberOfItems);

                    /* jshint ignore:end */
                },
                fn: function () {
                    /* jshint ignore:start */

                    var element, i;

                    // Update
                    for (i = 0; i < batchCount; i++) {
                        element = source[i];
                        element.completed = ! element.completed;
                    }
                    filtered = source.filter(this.makePredicateFn());

                    if (filtered.length !== numberOfItems - batchCount) {
                        throw 'Bad result';
                    }

                    // Restore
                    for (i = 0; i < batchCount; i++) {
                        element = source[i];
                        element.completed = ! element.completed;
                    }
                    filtered = source.filter(this.makePredicateFn());

                    if (filtered.length !== numberOfItems) {
                        throw 'Bad result';
                    }

                    /* jshint ignore:end */
                }
            }, utils));
        }

        if (appState.attr('options.runDeriveBatchUpdate')) {
            benchmarkSuite.add(can.extend({
                results: results,
                key: 'deriveBatchUpdate',
                name: 'Derived batch update (' + results.numberOfItems + ' items)',
                setup: function () {
                    /* jshint ignore:start */

                    var numberOfItems = 100000;
                    var batchCount = this.results.attr('numberOfItems');
                    var values = this.makeArray(numberOfItems);
                    var source = new can.List();

                    values.forEach(function (element, index) {
                        source.push(element);
                    });

                    var filtered = source.dFilter(this.makePredicateFn());

                    /* jshint ignore:end */
                },
                fn: function () {
                    /* jshint ignore:start */

                    var element, i;

                    // Update
                    for (i = 0; i < batchCount; i++) {
                        element = source.attr(i);
                        element.attr('completed', ! element.attr('completed'));
                    }

                    if (filtered.attr('length') !== numberOfItems - batchCount) {
                        throw 'Bad result';
                    }

                    // Restore
                    for (i = 0; i < batchCount; i++) {
                        element = source.attr(i);
                        element.attr('completed', ! element.attr('completed'));
                    }

                    if (filtered.attr('length') !== numberOfItems) {
                        throw 'Bad result';
                    }

                    /* jshint ignore:end */
                }
            }, utils));
        }
    });

    /* jshint ignore:end */
};


/**
 * Options/Graphing UI
 **/

can.Component.extend({
    tag: 'benchmark-options',
    template: can.view('benchmark-options-template'),
    viewModel: {
        define: {
            options: {
                value: {
                    define: {
                        '*': {
                            type: 'boolean',
                            value: false
                        }
                    }
                }
            },
            running: {
                value: false
            },
            testResults: {
                value: testResults
            }
        },
        init: function () {
            appState = this;
            can.route.map(this.attr('options'));
            can.route.ready();

            if (this.attr('options.startOnPageLoad')) {
                this.startBenchmarks();
            }
        },
        startBenchmarks: function () {
            var context = this;

            this.attr('running', true);

            setupBenchmarks();

            benchmarkSuite.on('complete', function () {
                context.attr('running', false);
            });

            // Render the button state before blocking repaints
            setTimeout(function () {
                benchmarkSuite.run({ async: false });
            }, 100);
        },
        resetOptions: function () {
            this.attr('options').attr({}, true);
        }
    }
});