# can-derive


Derive live can.List and can.Maps from source lists.


This support `O(log n)` maintaintence of mapped and filtered `can.List`s.  Basically this means if you setup a
derived list like `completed` in the following example:

```
var sourceList = new can.List([{name: "dishes", complete: true}, {name: "lawn", complete: false}, ...])

var completed = sourceList.filter(function(todo){
  return todo.attr("complete");
});
```

Any changes to `sourceList` will automatically update the derived `completed` list in O(log n) time.  
This avoids the standard O(n) times done everywhere else.
