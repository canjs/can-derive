var QUnit = require("steal-qunit");
var Map = require("../map/map");
var List = require("./list");

QUnit.module('can/list', {
    setup: function () {}
});

window.printTree = function (tree, debug, start, count) {
    console.log(tree.print(function (node) {
        var index = tree.indexOfNode(node);
        var value = (node.data === undefined ? '_' : node.data);
        var out =  index;
        if (debug !== false) {
            out += '(' +node.leftCount + '|' + node.leftGapCount + '|' + node.rightCount + ')';
        }
        out += ':' + value;
        return out;
    }, start, count));
};


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
            debugger;
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
    var cleanAlphabet = dirtyAlphabet.slice().filter(filterFn);
    var derived = source.filter(filterFn);

    ok(equalValues(derived, cleanAlphabet), 'Initial values are correct');
});

test('.filter() applies value change', function () {

    var source = new can.List(dirtyAlphabet);
    var filterFn = function (value, key) {
        return value ? true : false;
    };
    var cleanAlphabet = dirtyAlphabet.slice().filter(filterFn);
    var derived = source.filter(filterFn);

    source.attr(4, 'DD'); // D > DD
    cleanAlphabet[3] = 'DD'; // Update static list
    ok(equalValues(derived, cleanAlphabet), 'Set derived'); // Compare

    source.attr(10, 'II'); // I > II
    cleanAlphabet[8] = 'II';
    ok(equalValues(derived, cleanAlphabet), 'Set derived');

    source.attr(29, 'XX'); // X > XX
    cleanAlphabet[23] = 'XX';
    ok(equalValues(derived, cleanAlphabet), 'Set derived');
});

test('.filter() adds new items', function () {

    var source = new can.List(dirtyAlphabet);
    var filterFn = function (value, key) {
        return value ? true : false;
    };
    var cleanAlphabet = dirtyAlphabet.slice().filter(filterFn);
    var derived = source.filter(filterFn);

    // Add values
    source.unshift('Aey');
    cleanAlphabet.unshift('Aey');
    ok(equalValues(derived, cleanAlphabet), 'Item added via .unshift()');

    source.splice(20, 0, 'Ohh');
    cleanAlphabet.splice(16, 0, 'Ohh');
    ok(equalValues(derived, cleanAlphabet), 'Item added via .splice()');

    source.push('Zee');
    cleanAlphabet.push('Zee');
    ok(equalValues(derived, cleanAlphabet), 'Item added via .push()');
});

test('.filter() removes existing items', function () {

    var source = new can.List(dirtyAlphabet);
    var filterFn = function (value, key) {
        return value ? true : false;
    };
    var cleanAlphabet = dirtyAlphabet.slice().filter(filterFn);
    var derived = source.filter(filterFn);

    // Remove values
    source.shift();
    cleanAlphabet.shift();
    ok(equalValues(derived, cleanAlphabet), 'Item removed via .shift()');

    source.splice(10, 1);
    cleanAlphabet.splice(8, 1);
    ok(equalValues(derived, cleanAlphabet), 'Item removed via .splice()');

    source.pop();
    cleanAlphabet.pop();
    ok(equalValues(derived, cleanAlphabet), 'Item removed via .pop()');
});
