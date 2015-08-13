# Steal

**system-npm** comes bundled with [StealJS](http://stealjs.com). No extra configuration is needed to use it.

Install steal:

```js
npm install steal --save
```

And add it as a script tag to your page.

```html
<script src="node_modules/steal/steal.js"></script>
```

The `main` specified in your `package.json` file will be loaded automatically. If you use the same project for Node code you can use `browser` instead of `main`.
