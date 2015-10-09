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
    return function () {
        var values = window.makeArray(numberOfItems);

        var source = new can.DeriveList(values);
        var needle = window.makeItem(numberOfItems - 1);
        var predicateFn = window.makePredicateFn(needle);
        var filtered = source.filter(predicateFn);
        source._filtered = filtered;

        if (filtered.attr('length') !== 1) { throw new Error('Abort'); }

        return source;
    }
};

window.makeUpdateDerivedListFn = function (numberOfItems) {
    return function () {

        var source = window['sourceListWithLength' + numberOfItems];

        // Change the value so that it passes the filter
        source.attr('0.id', (numberOfItems - 1).toString(16));

        if (source._filtered.attr('length') !== 2) { throw new Error('Abort'); }

        // Change it back so that it's ready for the next test
        source.attr('0.id', '0');

        if (source._filtered.attr('length') !== 1) { throw new Error('Abort'); }
    }
};

// Setup some source lists for the update tests
window.sourceListWithLength10 = makePopulateDerivedListFn(10)();
window.sourceListWithLength100 = makePopulateDerivedListFn(100)();
window.sourceListWithLength1000 = makePopulateDerivedListFn(1000)();

benchmark.suite('can.DeriveList.filter')
    .add('Populating a derived list (10 items)', makePopulateDerivedListFn(10))
    .add('Populating a derived list (100 items)', makePopulateDerivedListFn(100))
    .add('Populating a derived list (1000 items)', makePopulateDerivedListFn(1000))
    .add('Updating a derived list (10 items)', makeUpdateDerivedListFn(10))
    .add('Updating a derived list (100 items)', makeUpdateDerivedListFn(100))
    .add('Updating a derived list (1000 items)', makeUpdateDerivedListFn(1000))