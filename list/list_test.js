var QUnit = require("steal-qunit");
var Map = require("../map/map");
var List = require("./list");

QUnit.module('can/list', {
    setup: function () {}
});

var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var alphabet = letters.split('');
alphabet.splice(2, 0, 0);
alphabet.splice(5, 0, 0);
alphabet.splice(12, 0, 0);
alphabet.splice(16, 0, 0);
alphabet.splice(22, 0, 0);
alphabet.splice(27, 0, 0);

var equalValues = function (list, expectedValues) {
    var match = true;

    list.each(function (item, index) {
        if (item !== expectedValues[index]) {
            deepEqual(item, expectedValues[index]);
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

    var source = new can.List(alphabet);

    var derived = source.derive().filter(function (value, key) {
        return value ? true : false;
    });

    ok(equalValues(derived, letters.split('')), 'Initial values are correct');
});

test('.filter() applies value change', function () {

    var source = new can.List(alphabet);
    var filterFn = function (value, key) {
        return value ? true : false;
    };
    var clonedAlphabet = alphabet.slice().filter(filterFn);
    var derived = source.derive().filter(filterFn);

    source.attr(4, 'DD'); // D > DD
    clonedAlphabet[3] = 'DD'; // Update static list
    ok(equalValues(derived, clonedAlphabet), 'Set derived'); // Compare

    source.attr(10, 'II'); // I > II
    clonedAlphabet[8] = 'II';
    ok(equalValues(derived, clonedAlphabet), 'Set derived');

    source.attr(29, 'XX'); // X > XX
    clonedAlphabet[23] = 'XX';
    ok(equalValues(derived, clonedAlphabet), 'Set derived');
});

test('.filter() adds new items', function () {

    var source = new can.List(alphabet);
    var filterFn = function (value, key) {
        return value ? true : false;
    };
    var clonedAlphabet = alphabet.slice().filter(filterFn);
    var derived = source.derive().filter(filterFn);

    // Add values
    source.unshift('Aey');
    clonedAlphabet.unshift('Aey');
    ok(equalValues(derived, clonedAlphabet), 'Item added via .unshift()');

    source.splice(20, 0, 'Ohh');
    clonedAlphabet.splice(16, 0, 'Ohh');
    ok(equalValues(derived, clonedAlphabet), 'Item added via .splice()');

    source.push('Zee');
    clonedAlphabet.push('Zee');
    ok(equalValues(derived, clonedAlphabet), 'Item added via .push()');
});

test('.filter() removes existing items', function () {

    var source = new can.List(alphabet);
    var filterFn = function (value, key) {
        return value ? true : false;
    };
    var clonedAlphabet = alphabet.slice().filter(filterFn);
    var derived = source.derive().filter(filterFn);

    // Remove values
    source.shift();
    clonedAlphabet.shift();
    ok(equalValues(derived, clonedAlphabet), 'Item removed via .shift()');

    source.splice(10, 1);
    clonedAlphabet.splice(8, 1);
    ok(equalValues(derived, clonedAlphabet), 'Item removed via .splice()');

    source.pop();
    clonedAlphabet.pop();
    ok(equalValues(derived, clonedAlphabet), 'Item removed via .pop()');
});
