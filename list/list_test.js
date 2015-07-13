var QUnit = require("steal-qunit");
var Map = require("../map/map");
var List = require("./list");

QUnit.module('can/list', {
    setup: function () {}
});

var equalValues = function (list, expectedValues) {
    var match = true;

    list.each(function (item, index) {
        if (item !== expectedValues[index]) {
            equal(expectedValues[index], item)
            match = false;
        }

        return match; // Stop iterating
    });

    return match;
};

test('Has filter method', function () {
    ok(List.prototype.filter, 'List has filter method');
});

test('.filter() derives the correct initial values', function () {

    var source = new can.List([undefined,'a','b','c']);

    var derived = source.filter(function (value, key) {
        return value ? true : false;
    });

    ok(equalValues(derived, ['a','b','c']), 'Initial values are correct');
});

test('.filter() applies value change', function () {

    var source = new can.List([undefined,'a','b','c']);

    var derived = source.filter(function (value, key) {
        return value ? true : false;
    });

    // Change values
    source.attr(1, 'b');
    ok(equalValues(derived, ['b','b','c']), 'Set derived');

    source.attr(2, 'c');
    ok(equalValues(derived, ['b','c','c']), 'Set derived');

    source.attr(3, 'a');
    ok(equalValues(derived, ['b','c','a']), 'Set derived');
});

test('.filter() adds new items', function () {

    var source = new can.List(['u',undefined,'a']);

    var derived = source.filter(function (value, key) {
        return value ? true : false;
    });

    // Add values
    source.unshift('f');
    ok(equalValues(derived, ['f','u','a']), 'Item added via .unshift()');

    source.splice(2, 0, 'b');
    ok(equalValues(derived, ['f','u','b','a']), 'Item added via .splice()');

    source.push('r');
    ok(equalValues(derived, ['f','u','b','a','r']), 'Item added via .push()');
});

test('.filter() removes existing items', function () {

    var source = new can.List(['r','u','b','b','e','r','s']);

    var derived = source.filter(function (value, key) {
        return value ? true : false;
    });

    // Remove values
    source.shift();
    ok(equalValues(derived, ['u','b','b','e','r','s']),
        'Item removed via .shift()');

    source.splice(2, 1);
    ok(equalValues(derived, ['u','b','e','r','s']),
        'Item removed via .splice()');

    source.pop();
    ok(equalValues(derived, ['u','b','e','r']),
        'Item removed via .pop()');
});