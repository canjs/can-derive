# can-derive

**can-derive** is a plugin that creates observable filtered lists that stay up-to-date with a source list.

For example, a todo list might contain items with a `completed` property. `can.List.filter` by default can generate a new can.List containing only completed items, but it is not tied to the source list. With can-derive, `can.List.dFilter` will change when the source list changes.

**can-derive** is ideal for cases where the source list contains at least 10 items and is expected to change.

## Install

Use npm to install `can-derive`:

> npm install can-derive --save

## Use

Use `require` in Node/Browserify workflows to import the `can-derive` plugin like:

```
require('can-derive');
```

Use `define`, `require`, or `import` in [StealJS](http://stealjs.com/) workflows to import the `can-derive` plugin like:

```
import 'can-derive';
```

Once you've imported `can-derive` into your project, simply use `can.List.filter` to generate a derived list based on a `filter` function. The following example derives a list of completed items from a todo list:
```
var sourceList = new can.List([{name: "dishes", complete: true}, 
                               {name: "lawn", complete: false}, 
                              ...])

var completed = sourceList.filter(function(todo){
  return todo.attr("complete");
});
```

Any changes to `sourceList` will automatically update the derived `completed` list:
```
completed.bind('add', function(ev, newItems){
	console.log(newItems);
});

sourceList.push({name: "cook", complete: true}, {name: "clean", complete: false});
// `{name: "cook", complete: true}`
```

### With can.Map.define

If you're using the [can.Map.define plugin](http://canjs.com/docs/can.Map.prototype.define.html), you can define a derived list like so:

```
{
	define: {
		todos: {
			Value: can.List
		},
		completedTodos: {
			get: function() {
				return this.attr('todos').dFilter(function(todo){
					return todo.attr('complete');
				});
			}
		}
	}
}
```

Note: The `can-derive` ensures that the define plugin's `get` method will
not observe "length" like it would a traditional [can.List](http://canjs.com/docs/can.List.html).

## API

The `can-derive` plugin adds the `dFilter` method to `can.List.prototype`, so all filtered lists are derived from a `can.List`.

### dFilter

`list.filter(predicate) -> DerivedList`

Generates a derived list based on a predicate function.

### attr

`derivedList.attr() --> Array`

Gets an array of all the elements in the derived list.

`derivedList.attr(index) --> Object`

Reads an element from an index on the filtered list. This references the *element in the source list* that *is at the specified index in the filtered list*.

### each

`derivedList.each(fn) --> DerivedList`

Iterates through the DerivedList, calling a function for each element. The elements provided inside the function will be the elements *in the source list*.

### Other can.List methods

Since DerivedList inherits from [can.List](http://canjs.com/docs/can.List.html), the following methods are also available:

- [filter](http://canjs.com/docs/can.List.prototype.filter.html)
- [indexOf](http://canjs.com/docs/can.List.prototype.indexOf.html)
- [map](http://canjs.com/docs/can.List.prototype.map.html)
- [replace](http://canjs.com/docs/can.List.prototype.replace.html)
- [slice](http://canjs.com/docs/can.List.prototype.slice.html)

### Disabled can.List methods

The filtered list is not changed manually, but is maintained as the source list changes. Because of this, the following `can.List` methods are disabled:

- push
- pop
- shift
- unshift
- splice

## Performance

`can-derive` optimizes for insertions and removals, completing them in `O(log n)` time. This means that changes to the source list will automatically update the derived list in `O(log n)` time, compared to the standard `O(n)` time you would expect in other implementations.

It does this by:

- Keeping the derived list in a red-black tree
- Listening for additions or removals in the source list
- Listening to when the result of the predicate function changes for any item

This algorithm was originally discussed in [this StackExchange thread](http://cs.stackexchange.com/questions/43447/order-preserving-update-of-a-sublist-of-a-list-of-mutable-objects-in-sublinear-t/44502#44502).

### When to Use

In general, it is preferable to use `can-derive` over alternative approaches when:

- Your source list contains 10 or more items
- You need to know how the filtered list changed, for instance when rendering in the DOM.


## Contributing

To set up your dev environment:

1. Clone and fork this repo.
2. Run `npm install`.
3. Open `list/test.html` in your browser. Everything should pass.
4. Run `npm test`. Everything should pass.
5. Run `npm run-script build`. Everything should build ok 
