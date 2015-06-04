var Map = require('can/map/map');
var List = require('can/map/map');

var derive = function () {
	return true;
}

can.Map.prototype.derive = derive; 
can.List.prototype.derive = derive;

module.exports = derive;