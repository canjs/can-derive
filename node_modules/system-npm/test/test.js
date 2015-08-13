QUnit.module("system-npm plugin");
var GlobalSystem = window.System;


var makeIframe = function(src){
	var iframe = document.createElement('iframe');
	window.removeMyself = function(){
		delete window.removeMyself;
		document.body.removeChild(iframe);
		QUnit.start();
	};
	document.body.appendChild(iframe);
	iframe.src = src;
};

asyncTest("utils.moduleName.create and utils.moduleName.parse", function(){
	GlobalSystem['import']("npm-utils")
		.then(function(utils){
			var parsed = utils.moduleName.parse("abc/foo/def","bar");
			equal(parsed.modulePath, "foo/def", "is absolute");

			var parsed = utils.moduleName.parse("abc#./foo/def","bar");
			equal(parsed.modulePath, "./foo/def", "is relative");

			var res = utils.moduleName.create(parsed);
			equal(res,"abc#foo/def", "set back to absolute");

		}).then(QUnit.start);

});

asyncTest("crawl.getDependencyMap", function(){
	GlobalSystem['import']("npm-crawl")
		.then(function(crawl){
			var deps = crawl.getDependencyMap({}, {
				dependencies: {"bower": "1.2.3", "can": "2.2.2"}
			});
			deepEqual(deps, { "can": {name: "can", version: "2.2.2"}});

		}).then(QUnit.start);

});

asyncTest("transpile works", function(){
	Promise.all([
		System["import"]("transpile"),
		System["import"]("jquery")
	]).then(function(res){
		var transpile = res[0],
			$ = res[1];

		equal(typeof transpile, "object", "object returned");
		equal(typeof $, "function", "function returned");

		return new Promise(function(resolve, reject){

				$.ajax("../node_modules/transpile/test/tests/es6.js",{dataType: "text"}).then(function(data){
					var res = transpile.to({
						source: ""+data,
						address: "../node_modules/transpile/test/tests/es6.js",
						name: "tests/es6",
						metadata: {format: "es6"}
					}, "cjs");

					return $.ajax("../node_modules/transpile/test/tests/expected/es6_cjs.js",{dataType: "text"})
						.then(function(answer){
							QUnit.equal(answer, res);
					});

				}, reject).then(resolve, reject);
		});

	}).then(start);
});

asyncTest("Loads globals", function(){
	GlobalSystem["import"]("jquery").then(function($){
		ok($.fn.jquery, "jQuery loaded");
	}).then(start, start);
});


asyncTest("meta", function(){

	GlobalSystem["import"]("test/meta").then(function(meta){
		equal(meta,"123", "got 123");
	}).then(start);
});

asyncTest("module names that start with @", function(){
	GlobalSystem.paths["@foo"] = "test/foo.js";
	GlobalSystem["import"]("@foo").then(function(foo){
		equal(foo,"bar", "got 123");
	}).then(start);
});

asyncTest("jquery-ui", function(){
	GlobalSystem.paths["@foo"] = "test/foo.js";
	Promise.all([
		GlobalSystem["import"]("jquery"),
		GlobalSystem["import"]("jquery-ui/draggable")
	]).then(function(mods){
		var $ = mods[0];
		ok($.fn.draggable);
	}).then(start, start);

});

asyncTest("import self", function(){
	Promise.all([
		GlobalSystem["import"]("system-npm"),
		GlobalSystem["import"]("system-npm/test/meta")
	]).then(function(mods){
		equal(mods[0], "example-main", "example-main");
		equal(mods[1], "123", "system-npm/test/meta");
	}).then(start);
});

asyncTest("modules using process.env", function(){
	GlobalSystem.env = "development";
	GlobalSystem["delete"]("package.json!npm");
	delete window.process;
	GlobalSystem["import"]("package.json!npm").then(function() {
		return GlobalSystem["import"]("test/env");
	}).then(function(env){
		equal(env, "development", "loaded the env");
	}).then(start);
});

asyncTest("module names", function(){
	makeIframe("not_relative_main/dev.html");
});

asyncTest("main does not include .js in map", function(){
	makeIframe("map_main/dev.html");
});

asyncTest("ignoreBrowser", function(){
	makeIframe("ignore_browser/dev.html");
});

asyncTest("directories.lib", function(){
	makeIframe("directories_lib/dev.html");
});

asyncTest("github ranges as requested versions are matched", function(){
	makeIframe("git_ranges/dev.html");
});

asyncTest("support an alternate name for npm modules", function(){
	makeIframe("alt_name/dev.html");
});

asyncTest("works with packages that have multiple versions of the same dependency", function(){
	makeIframe("mult_dep/dev.html");
});

asyncTest("works when System.map and System.paths are provided", function(){
	makeIframe("map_paths/dev.html");
});

asyncTest("browser config pointing to an alt main", function(){
	makeIframe("browser/dev.html");
});

asyncTest("browser config to ignore a module", function(){
	makeIframe("browser-false/dev.html");
});

asyncTest("configDependencies combined from loader and pkg.system", function(){
	makeIframe("config_deps/dev.html");
});

asyncTest("Converting name of git versions works", function(){
	makeIframe("git_config/dev.html");
});

asyncTest("local mappings are applied in normalize", function(){
	makeIframe("map_same/dev.html");
});

asyncTest("contextual maps work", function(){
	makeIframe("contextual_map/dev.html");
});

asyncTest("configDependencies can override config with systemConfig export", function(){
	makeIframe("ext_config/dev.html");
});

QUnit.module("npmDependencies");

asyncTest("are used exclusively if npmIgnore is not provided", function(){
	makeIframe("npm_deps_only/dev.html");
});

asyncTest("override npmIgnore when npmIgnore is provided", function(){
	makeIframe("npm_deps_override/dev.html");
});

asyncTest("ignores devDependencies when no npmDependencies is provided", function(){
	makeIframe("npm_deps_devignore/dev.html");
});

asyncTest("npmIgnore a single module works", function(){
	makeIframe("npm_deps_ignore/dev.html");
});

// Only run these tests for StealJS (because it requires steal syntax)
if(window.steal) {
	asyncTest("canjs", function(){
		Promise.all([
			GlobalSystem["import"]("can"),
			GlobalSystem["import"]("can/control/control")
		]).then(function(mods){
			var can = mods[0],
				Control = mods[1];
			ok(Control.extend, "Control has an extend method");
			ok(can.Control.extend, "control");
		}).then(start);

	});

	asyncTest("load in a webworker", function(){
		makeIframe("worker/dev.html");
	});
}

QUnit.start();
