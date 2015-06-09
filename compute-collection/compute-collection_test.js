var QUnit = require("steal-qunit");
var Map = require("can/map/map");
var List = require("can/list/list");
var derive = require('./compute-collection');

QUnit.module('can/compute-collection', {
    setup: function () {}
});

can.each([
    {
        title: 'Map',
        source: function () { return new Map({ 0: 'a', 1: 'b', 2: 'c'}); }
    },
    {
        title: 'List',
        source: function () { return new List(['a', 'b', 'c']); }
    }
], function (sample) {

    // Prefix the test name with the source sample title
    var _test = QUnit.test;
    var test = function () {
        var args = can.makeArray(arguments);
        args[0] = sample.title + ': ' + args[0];
        _test.apply(this, args);
    };

    test('Bindings are not created unless collection is bound to', function () {
        var source = sample.source();
        var collection = new can.ComputeCollection(source);

        collection.attr('valueFn', function (item) {
            ok(false, 'No computes should not be created');
            return item;
        });

        source.attr('0', 'z');

        ok(true, 'valueFn was not run');
    });

    test('Will not dispatch events without a key/value function defined', function () {
        var source = sample.source();
        var collection = new can.ComputeCollection(source);

        collection.bind('value', function () {
            ok(false, 'No event should be dispatched');
        });

        source.attr('0', 'z');

        ok(true, 'Change triggered no events');
    });

    test('The "valueFn" gets run on "set"', function () {
        var source = sample.source();
        var collection = new can.ComputeCollection(source);

        collection.attr('valueFn', function (item) {
            ok(true, 'valueFn was run');
            return item;
        });

        collection.bind('value', can.noop);

        source.attr('0', 'z');
    });

    test('Can bind to "value" change', function () {
        var source = sample.source();
        var collection = new can.ComputeCollection(source);

        collection.attr('valueFn', function (item) {
            ok(true, 'valueFn was run');
            return item;
        });

        collection.bind('value', function () {
            ok(true, '"value" event was dispatched');
        });

        source.attr('0', 'z');
    });

    test('Can bind to "key" change', function () {
        var source = sample.source();
        var collection = new can.ComputeCollection(source);

        // Setup binding to source
        collection.bind('key', can.noop);

        collection.attr('keyFn', function (item, i) {
            ok(true, 'keyFn was run');
            return i;
        });

        // Listen for key change
        collection.bind('key', function (ev, newKey, oldKey, computes) {
            ok(true, '"key" event was dispatched');
            equal(oldKey, undefined, '"oldKey" is `undefined` because it was an "add"');
            equal(newKey, 3, '"newKey" is the correct value');
            equal(typeof computes, 'object', '"computes" are passed');
            equal(computes.sourceKey(), newKey, '"sourceKey" matches "newKey"');
        });

        source.attr('3', 'z');
    });

    test('Removed items are removed from the store', function () {
        var source = sample.source();
        var collection = new can.ComputeCollection(source);

        var count = function () {
            var length = 0;

            can.each(collection._computes._store, function (item, i) {
                length++;
            });

            return length;
        }

        collection.attr('keyFn', function (item, i) { return i; });
        collection.bind('key', can.noop);


        var i = count();

        // Account for index difference in map/list
        i = (! source instanceof List ? i : i - 1);

        while(i > -1) {
            source.removeAttr(i);
            i--;
        }

        var length = count();

        equal(length, 0, 'There are no items in the store');
    });

    // TODO: Test that removing an item unbinds its computes

});