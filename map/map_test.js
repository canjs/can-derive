var QUnit = require("steal-qunit");
var Map = require("can/map/map");
var List = require("can/list/list");
require('./map');

QUnit.module('can/map', {
    setup: function () {}
});

test('Has filter method', function () {
    ok(Map.prototype.filter, 'Map has filter method');
});

test('Filtered map includes/excludes correct keys', function () {
    var source = new can.Map({ a: 0, b: 1, c: 2 });
    var derived = source.filter(function (value, key) {
        return value % 2 === 0;
    });

    // Initial
    equal(derived.attr('a'), 0, 'Source key exists/has correct value in derived map');
    equal(derived.attr('b'), undefined, 'Source key does not exist in derived map');
    equal(derived.attr('c'), 2, 'Source key exists/has correct value in derived map');

    // Change
    source.attr('b', 20);
    equal(derived.attr('b'), 20, 'Changed source key exists/has correct value in derived map');

    source.attr('b', 30);
    equal(derived.attr('b'), 30, 'Changed source key exists/has correct value in derived map');

    // Add
    source.attr('f', 200);
    equal(derived.attr('f'), 200, 'Added source key exists/has correct value in derived map');

    // Remove
    source.removeAttr('a');
    equal(derived.attr('a'), undefined, 'Removed source key is removed from derived map');

});