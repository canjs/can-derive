var benchmark = require('steal-benchmark');
var can = require('can');
require("./list");

window.NUMBER_OF_ITEMS = 10000;

window.makeItem = function (index) {
    return new can.Map({
        id: index.toString(16),
        firstName: 'Chris',
        lastName: 'Gomez',
        fullName: function () {
            return [this.attr('firstName'), this.attr('lastName'),
            this.attr('id')].join(' ');
        }
    });
};

window.makeArray = function (length) {
    var a = [];
    for (var i = 0; i < length; i++) {
        a.push(window.makeItem(i));
    }
    return a;
};

window.makePredicateFn = function (needle) {
    return function (item) {
        return item.fullName() === needle.fullName();
    };
};

benchmark.suite('can.derive.List.filter')
    .add({
        name: 'Populating a derived list ' + window.NUMBER_OF_ITEMS,
        setup: function() {
            var values = window.makeArray(window.NUMBER_OF_ITEMS);
            var needle = window.makeItem(window.NUMBER_OF_ITEMS - 1);
            var predicateFn = window.makePredicateFn(needle);
        },
        fn: function () {
            var source = new can.derive.List(values);

            console.time('Create filtered list');
            var filtered = source.filter(predicateFn);
            console.timeEnd('Create filtered list');

            if (filtered.attr('length') !== 1) { throw new Error('Abort'); }
        }
    })
    .add({
        name: 'Updating a derived list ' + window.NUMBER_OF_ITEMS,
        setup: function () {
            var needle = window.makeItem(window.NUMBER_OF_ITEMS - 1);
            var predicateFn = window.makePredicateFn(needle);
        },

        fn: function () {
            var values = window.makeArray(window.NUMBER_OF_ITEMS);
            var source = new can.derive.List(values);
            var filtered = source.filter(predicateFn);

            // Change the value so that it passes the filter
            source.attr('0.id', (window.NUMBER_OF_ITEMS - 1).toString(16));

            if (filtered.attr('length') !== 2) { throw new Error('Abort'); }

            console.time('Update filtered list');
            // Change it back so that it's ready for the next test
            source.attr('0.id', '0');

            console.timeEnd('Update filtered list');

            if (filtered.attr('length') !== 1) { throw new Error('Abort'); }
        }
    });