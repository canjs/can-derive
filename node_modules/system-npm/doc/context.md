@typedef {{}} system-npm/context

@option {Array<NpmPackage>} packages An array of package data found
@option {Loader} loader A system loader
@option {Object<Name,Object<Range,NpmPackage>>} versions An map of a name of a package to 
another map of each version to the package objects.
@option {Object<URL,NpmPackage>} paths A mapping of paths to npmPackages. 

A limited amount of de-duplication takes place here.  If two modules request the 
same version of a module (eg `{jquery: ">1.2.3"}`), instead of loading the 
second `jquery/package.json`, a paths entry for the second `jquery/package.json` will
point to the first `jquery/package.json`'s package data.  Something like this will happen:

```
context.paths["module_a/node_modules/jquery.js"] === 
    context.paths["module_b/node_modules/jquery.js"]  //-> true
```

