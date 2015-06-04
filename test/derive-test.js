var QUnit = require("steal-qunit");
var Map = require("can/map/map");
var List = require("can/list/list");
var derive = require('../can-derive');

QUnit.module('can/derive', {
	setup: function () {}
});

QUnit.test('Boilerplate', function () {
	ok(Map.prototype.derive(), 'Map has derive method');
	ok(List.prototype.derive(), 'List has derive method');
});
