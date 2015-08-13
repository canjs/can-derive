var QUnit = require("steal-qunit");
var Map = require("../map/map");
var List = require("./list");

QUnit.module('can/list', {
    setup: function () {}
});

var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var dirtyAlphabet = letters.split('');
dirtyAlphabet.splice(2, 0, 0);
dirtyAlphabet.splice(5, 0, 0);
dirtyAlphabet.splice(12, 0, 0);
dirtyAlphabet.splice(16, 0, 0);
dirtyAlphabet.splice(22, 0, 0);
dirtyAlphabet.splice(27, 0, 0);

var equalValues = function (list, expectedValues) {
    var match = true;
    var foo = arguments[0];
    list.each(function (item, index) {
        if (item !== expectedValues[index]) {
            match = false;
        }
        strictEqual(item, expectedValues[index], 'Items match');
    });

    return match;
};

test('Has filter method', function () {
    ok(List.prototype.filter, 'List has filter method');
});

test('.filter() derives the correct initial values', function () {

    var source = new can.List(dirtyAlphabet);
    var filterFn = function (value, key) {
        return value ? true : false;
    };
    var expected = dirtyAlphabet.slice().filter(filterFn);
    var derived = source.filter(filterFn);

    ok(equalValues(derived, expected), 'Initial values are correct');
});

test('.filter() applies value change', function () {

    var alphabet = dirtyAlphabet.slice();
    var source = new can.List(alphabet);
    var filterFn = function (value, key) { return value ? true : false; };
    var derived = source.filter(filterFn);
    var expected;

    source.attr(4, 'DD'); // D -> DD
    alphabet[4] = 'DD'; // Update static list
    expected = alphabet.filter(filterFn);

    ok(equalValues(derived, expected), 'Set derived'); // Compare

    source.attr(10, 'II'); // I -> II
    alphabet[10] = 'II';
    expected = alphabet.filter(filterFn);

    ok(equalValues(derived, expected), 'Set derived');

    source.attr(29, 'XX'); // X -> XX
    alphabet[29] = 'XX';
    expected = alphabet.filter(filterFn);

    ok(equalValues(derived, expected), 'Set derived');
});

test('.filter() adds new items', function () {

    var alphabet = dirtyAlphabet.slice();
    var source = new can.List(alphabet);
    var filterFn = function (value, key) { return value ? true : false; };
    var derived = source.filter(filterFn);
    var expected;

    derived.bind('add', function (ev, items, offset) {
        items.forEach(function (item, index) {
            equal(item, expected[offset + index],
                'Add event reports correct value/index');
        });
    });

    // Add values
    alphabet.unshift('Aey');
    expected = alphabet.filter(filterFn);
    source.unshift('Aey');

    ok(equalValues(derived, expected), 'Item added via .unshift()');

    alphabet.splice(20, 0, 'Ohh');
    expected = alphabet.filter(filterFn);
    source.splice(20, 0, 'Ohh');

    ok(equalValues(derived, expected), 'Item added via .splice()');

    alphabet.push('Zee');
    expected = alphabet.filter(filterFn);
    source.push('Zee');

    ok(equalValues(derived, expected), 'Item added via .push()');
});

test('.filter() removes existing items', function () {
    var alphabet = dirtyAlphabet.slice();
    var source = new can.List(alphabet);
    var filterFn = function (value, key) { return value ? true : false; };
    var derived = source.filter(filterFn);
    var expected;

    // Remove values
    source.shift();
    alphabet.shift();
    expected = alphabet.filter(filterFn);

    ok(equalValues(derived, expected), 'Item removed via .shift()');

    source.splice(10, 1);
    alphabet.splice(10, 1);
    expected = alphabet.filter(filterFn);

    ok(equalValues(derived, expected), 'Item removed via .splice()');

    source.pop();
    alphabet.pop();
    expected = alphabet.filter(filterFn);

    ok(equalValues(derived, expected), 'Item removed via .pop()');
});
