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

    var source = new can.List(['a','b','c']);
    // var source = new can.List(['a','b','cc', 'd', 'e']);

    var derived = source.filter(function (value, key) {
        return key % 2 === 0;
    }); //-> derived: [a, c]

    // Initial
    equal(derived.attr(0), 'a', 'Source value mapped to correct index in derived list');
    equal(derived.attr(1), 'c', 'Source value mapped to correct index in derived list');

    // Change

    source.attr(2, 'cc'); //-> derived: [a, cc]
    equal(derived.attr(0), 'a', 'Changed source value didn\'t remove item');
    equal(derived.attr(1), 'cc', 'Changed source value mapped to correct index in derived list');

    // Add
    source.push('d'); //-> derived: [a, cc]
    source.push('e'); //-> derived: [a, cc, e]
    equal(derived.attr(0), 'a', 'Added source value didn\'t remove item');
    equal(derived.attr(1), 'cc', 'Added source value didn\'t remove item');
    equal(derived.attr(2), 'e', 'Added source value added to derived list');

    // Remove
    source.shift(); //-> derived: [b, d]

    equal(derived.attr(0), 'b', 'Removed source value shifted filter value');
    equal(derived.attr(1), 'd', 'Removed source value shifted filter value');
});