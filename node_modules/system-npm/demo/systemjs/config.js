System.config({
  "baseURL": "./",
  "map": {
    "npm": "system-npm/npm",
    "npm-extension": "system-npm/npm-extension"
  },
  "paths": {
    "*": "*.js",
    "system-npm/*": "node_modules/system-npm/*.js"
  }
});
