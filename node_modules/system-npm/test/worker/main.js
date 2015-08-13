
var worker = new Worker(System.stealURL+"?main=test/worker/worker");

worker.addEventListener("message", function(ev){
	if(window.QUnit) {
		QUnit.deepEqual(ev.data,  {name: "dep"}, "got a post message");
		removeMyself();
	} else {
		console.log("got message", ev);
	}

});

module.exports = worker;
