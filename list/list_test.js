var QUnit = require("steal-qunit");
var Map = require("../map/map");
var List = require("./list");

QUnit.module('can/list', {
    setup: function () {}
});

test('Has filter method', function () {
    ok(List.prototype.filter, 'List has filter method');
});

test('Filtered list includes/excludes correct keys', function () {
    var source = new can.List([
        'a', 'b', 'c'
    ]);
    var derived = source.filter(function (value, key) {
        return key % 2 === 0;
    });

    // Initial
    equal(derived._source.attr(0).value(), 'a', 'Source value mapped to correct index in sorted list');
    equal(derived._source.attr(1).value(), 'c', 'Source value mapped to correct index in sorted list');
    equal(derived.attr(1), 'c', 'Source value mapped to correct index in derived list');

    // Change
    source.attr(2, 'cc');
    equal(derived._source.attr(1).value(), 'cc', 'Changed source value mapped to correct index in sorted list');
    equal(derived.attr(1), 'cc', 'Changed source value mapped to correct index in derived list');

    // Add
    source.push('d');
    source.push('e');
    equal(derived._source.attr(2).value(), 'e', 'Added source value added to sorted list');
    equal(derived.attr(2), 'e', 'Added source value added to derived list');

    // Remove
    source.shift();
    equal(derived._source.attr(0).value(), 'b', 'Removed source value removed from sorted list');
    equal(derived.attr(0), 'b', 'Removed source value removed from deri list');
});