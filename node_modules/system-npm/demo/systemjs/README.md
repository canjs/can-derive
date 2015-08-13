# SystemJS

To use **system-npm** with SystemJS you'll first want to install SystemJS into your project. In this demo we've included `system.js` and `es6-module-loader.js` in the `vendor/` folder. Then add a script tag to your page to load SystemJS:

```html
<script src="vendor/system.js"></script>
```

## Installing

Install **system-npm** through npm.

```shell
npm install system-npm --save
```

## Configuring

Next you'll want to configure SystemJS to know where to load the plugin. Create a `config.js` file and add the appropriate config:

```js
System.config({
	map: {
		"npm": "system-npm",
		"npm-extension": "system-npm/npm-extension"
	},
	paths: {
		"system-npm/*": "node_modules/system-npm/*.js"
	}
});
```

This tells SystemJS how to load system-npm. Add the configuration script to your page after SystemJS:

```js
<script src="config.js"></script>
```

## Load your app

Now that it is configured you can load your `package.json` using the plugin and then start up your applicaiton:

```html
<script>
	System.import("package.json!npm").then(function(){
		System.import("app/app");
	});
</script>
```
