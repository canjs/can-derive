var benchmark = require('steal-benchmark');
var can = require('can');
require("./list");

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
        a.push(makeItem(i));
    }
    return a;
};

window.makePredicateFn = function (needle) {
    return function (item) {
        return item.fullName() === needle.fullName();
    }
};

window.makePopulateDerivedListFn = function (numberOfItems) {

    return {
        setup:
            "var numberOfItems = " + numberOfItems + ";" +
            "var values = window.makeArray(numberOfItems);" +
            "var needle = window.makeItem(numberOfItems - 1);" +
            "var predicateFn = window.makePredicateFn(needle);" +
            "var source = new can.DeriveList(values);",

        fn: function () {
            // console.time('fn')
            var filtered = source.filter(predicateFn);
            // console.timeEnd('fn')
            if (filtered.attr('length') !== 1) { throw new Error('Abort'); }
        },
        /*onStart: function () {
            console.profile('populate');
        },
        onComplete: function () {
            console.profileEnd('populate');
        }*/
    }
};

window.makeUpdateDerivedListFn = function (numberOfItems) {

    return {
        setup:
            "var numberOfItems = " + numberOfItems + ";" +
            "var values = window.makeArray(numberOfItems);" +
            "var needle = window.makeItem(numberOfItems - 1);" +
            "var predicateFn = window.makePredicateFn(needle);" +
            "var source = new can.DeriveList(values);" +
            "var filtered = source.filter(predicateFn)",

        fn: function () {
            // Change the value so that it passes the filter
            source.attr('0.id', (numberOfItems - 1).toString(16));

            if (filtered.attr('length') !== 2) { throw new Error('Abort'); }

            // Change it back so that it's ready for the next test
            source.attr('0.id', '0');

            if (filtered.attr('length') !== 1) { throw new Error('Abort'); }
        }
    }
};

benchmark.suite('can.DeriveList.filter')
    .add('Populating a derived list (10 items)', makePopulateDerivedListFn(10))
    .add('Populating a derived list (100 items)', makePopulateDerivedListFn(100))
    .add('Populating a derived list (1000 items)', makePopulateDerivedListFn(1000))
    .add('Populating a derived list (10000 items)', makePopulateDerivedListFn(10000))
    .add('Updating a derived list (10 items)', makeUpdateDerivedListFn(10))
    .add('Updating a derived list (100 items)', makeUpdateDerivedListFn(100))
    .add('Updating a derived list (1000 items)', makeUpdateDerivedListFn(1000))
