var Benchmark = require('benchmark');
var can = require('can');
var diff = require('can/util/array/diff.js');

require("./list");
require('can/view/autorender/autorender');
require('can/view/stache/stache');

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
        runTest: {
            type: 'boolean',
            value: true
        },
        numberOfItems: {
            type: 'number'
        },
        '*': {
            value: '-'
        }
    }
});

var testResults = new can.List([
    new ResultMap({ runTest: true, numberOfItems: 1 }),
    new ResultMap({ runTest: true, numberOfItems: 10 }),
    new ResultMap({ runTest: true, numberOfItems: 100 }),
    new ResultMap({ runTest: true, numberOfItems: 1000 }),
    new ResultMap({ runTest: true, numberOfItems: 10 * 1000 }),
    new ResultMap({ runTest: true, numberOfItems: 100 * 1000 }),
]);

var benchmarkSuite = new Benchmark.Suite('can.derive.List.dFilter')
    .on('cycle', function (ev) {
        var benchmark = ev.target;
        var averageMs = (benchmark.stats.mean * benchmark.adjustment) * 1000;

        console.log(benchmark.toString() +
            ' [Avg runtime: ' + averageMs + ']');

        benchmark.results.attr(benchmark.key, averageMs);
    });

var setupBenchmarks = function () {
    testResults.each(function (results) {

        if (! results.attr('runTest')) {
            return;
        }

        if (appState.attr('options.runNativePopulate')) {
            benchmarkSuite.add(can.extend({
                adjustment: 1,
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
                adjustment: 1,
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
                adjustment: 0.5,
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
                adjustment: 0.5,
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

        if (appState.attr('options.runVirtualDomUpdate') && results.numberOfItems <= 10 * 1000) {
            benchmarkSuite.add(can.extend({
                adjustment: 0.5,
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
                    /* jshint ignore:start */

                    $(this.sandboxEl).empty();

                    /* jshint ignore:end */
                }
            }, utils));
        }

        if (appState.attr('options.runDeriveDomUpdate') && results.numberOfItems <= 10 * 1000) {
            benchmarkSuite.add(can.extend({
                adjustment: 0.5,
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

                    var fragment = renderer({
                        filtered: filtered
                    });

                    $('#sandbox').html(fragment);

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
                },
                teardown: function () {
                    /* jshint ignore:start */

                    // Deal with async unbind inside of benchmarks for loop
                    if (window.unbindComputes) { window.unbindComputes(); }

                    // Remove the reference in the DOM that ties back to the
                    // last filtered/source list
                    $('#sandbox').empty();

                    /* jshint ignore:end */
                }
            }, utils));
        }


        if (appState.attr('options.runReducedNativeUpdate')) {
            benchmarkSuite.add(can.extend({
                adjustment: 0.5,
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
                adjustment: 0.5,
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

        if (appState.attr('options.runReducedNativeDomUpdate') && results.numberOfItems <= 10 * 1000) {
            benchmarkSuite.add(can.extend({
                adjustment: 0.5,
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
                    /* jshint ignore:start */

                    $(this.sandboxEl).empty();

                    /* jshint ignore:end */
                }
            }, utils));
        }

        if (appState.attr('options.runReducedDeriveDomUpdate') && results.numberOfItems <= 10 * 1000) {
            benchmarkSuite.add(can.extend({
                adjustment: 0.5,
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

                    var fragment = renderer({
                        filtered: filtered
                    });

                    $(this.sandboxEl).html(fragment);

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

                    // Remove the reference in the DOM that ties back to the
                    // last filtered/source list
                    $(this.sandboxEl).empty();

                    /* jshint ignore:end */
                }
            }, utils));
        }

        if (appState.attr('options.runNativeBatchUpdate')) {
            benchmarkSuite.add(can.extend({
                adjustment: 0.5,
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
                adjustment: 0.5,
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