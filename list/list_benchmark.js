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
    makeItem: function (index) {
        return new can.Map({
            id: index.toString(16),
            firstName: 'Chris',
            lastName: 'Gomez',
            fullName: function () {
                return [this.attr('firstName'), this.attr('lastName'),
                this.attr('id')].join(' ');
            }
        });
    },
    makeArray: function (length) {
        var a = [];
        for (var i = 0; i < length; i++) {
            a.push(this.makeItem(i));
        }
        return a;
    },
    makePredicateFn: function (needle) {
        return function (item) {
            return item.fullName() === needle.fullName();
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
        nativeUpdate: {
            value: '-'
        },
        derivePopulate: {
            value: '-'
        },
        deriveUpdate: {
            value: '-'
        },
        breakEvenUpdateCount: {
            get: function () {
                var nativePopulate = this.attr('nativePopulate');
                // var nativeUpdate = this.attr('nativeUpdate');
                var derivePopulate = this.attr('derivePopulate');
                var deriveUpdate = this.attr('deriveUpdate');

                if (typeof nativePopulate !== 'number' ||
                        // typeof nativeUpdate !== 'number' ||
                        typeof derivePopulate !== 'number' ||
                        typeof deriveUpdate !== 'number') {
                    return '-';
                }

                return (derivePopulate - nativePopulate) /
                    (nativePopulate - deriveUpdate);
            }
        }
    }
});

var testResults = new can.List([
    new ResultMap({ numberOfItems: 5000 }),
    new ResultMap({ numberOfItems: 10000 }),
    new ResultMap({ numberOfItems: 15000 }),
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
                    var needle = this.makeItem(numberOfItems - 1);
                    var predicateFn = this.makePredicateFn(needle);

                    /* jshint ignore:end */
                },
                fn: function () {
                    /* jshint ignore:start */

                    var filtered = source.filter(predicateFn);

                    if (filtered.length !== 1) { throw new Error('Abort'); }

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
                    var needle = this.makeItem(numberOfItems - 1);
                    var predicateFn = this.makePredicateFn(needle);
                    var source = new can.List(values);

                    /* jshint ignore:end */
                },
                fn: function () {
                    /* jshint ignore:start */

                    var filtered = source.dFilter(predicateFn);

                    if (filtered.attr('length') !== 1) {
                        throw new Error('Abort');
                    }

                    // Remove reference so that next filter starts from scratch
                    delete source._derivedList;

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
                    var needle = this.makeItem(numberOfItems - 1);
                    var predicateFn = function (item) {
                        return item.fullName() !== needle.fullName();
                    }
                    var oldFiltered = source.filter(predicateFn);
                    window.count = 0;

                    /* jshint ignore:end */
                },
                fn: function () {
                    /* jshint ignore:start */

                    // Change the value so that it FAILS the predicate test
                    source[numberOfItems - 2].attr('id',
                        (numberOfItems - 1).toString(16));

                    var newFiltered = source.filter(predicateFn);

                    // Do a diff to find out what changed
                    // NOTE: Diffing is pretty quick...
                    // http://jsbin.com/yujabaqabi/edit?js,console
                    var patch = this.diff(oldFiltered, newFiltered);


                    patch.forEach(function (diff) {
                        if (diff.deleteCount !== 1) {
                            throw new Error('Abort');
                        }
                        if (diff.index !== numberOfItems - 2) {
                            throw new Error('Abort');
                        }
                        if (diff.insert.length !== 0) {
                            throw new Error('Abort');
                        }

                        window.count ++;
                    });

                    // Change the value so that it PASSES the predicate test
                    source[numberOfItems - 2].attr('id', (Math.random() + 1).toString(16));

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
                    var needle = this.makeItem(numberOfItems - 1);
                    var predicateFn = this.makePredicateFn(needle);
                    var source = new can.List(values);
                    var filtered = source.dFilter(predicateFn);

                    /* jshint ignore:end */
                },
                fn: function () {
                    /* jshint ignore:start */

                    if (filtered.attr('length') !== 1) {
                        throw new Error('Abort');
                    }

                    // Change the value so that it PASSES the predicate test
                    source.attr('0.id', (numberOfItems - 1).toString(16));

                    if (filtered.attr('length') !== 2) {
                        throw new Error('Abort');
                    }

                    // Change the value so that it FAILS the predicate test
                    source.attr('0.id', (0).toString(16));

                    if (filtered.attr('length') !== 1) {
                        throw new Error('Abort');
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
                        runNativePopulate: {
                            type: 'boolean',
                            value: true
                        },
                        runNativeUpdate: {
                            type: 'boolean',
                            value: false
                        },
                        runDerivePopulate: {
                            type: 'boolean',
                            value: true
                        },
                        runDeriveUpdate: {
                            type: 'boolean',
                            value: true
                        },
                        startOnPageLoad: {
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
                benchmarkSuite.run();
            }, 100);
        },
        resetOptions: function () {
            this.attr('options').attr({}, true);
        }
    }
});