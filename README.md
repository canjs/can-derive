# can-derive

[![Build Status](https://travis-ci.org/canjs/can-derive.svg?branch=master)](https://travis-ci.org/canjs/can-derive)

**can-derive** is a plugin that creates observable filtered lists that remain
in sync with their original source list.

For example, a todo list might contain todo objects with a `completed` property.
Traditionally `can.List.filter` enables you to create a new `can.List`
containing only the "completed" todo objects. However, if the source list were
to change in any way - for instance via an "add" or "remove" - the returned
`can.List` may become an innaccurate representation of the source list.
The same filtered list of "completed" todo objects created
with `can-derive`'s `can.List.dFilter` would always be an accurate
representation of with the source list regardless of how it was manipulated.

**can-derive** is ideal for cases where the source list contains at least
10 items and is expected to be "changed" frequently (3 or more times).

Check out <a href="http://canjs.github.io/can-derive/" target="_blank">the demo</a>.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Install](#install)
- [Use](#use)
  - [With can.Map.define](#with-canmapdefine)
  - [Accessing FilteredList values](#accessing-filteredlist-values)
- [API](#api)
  - [can.List](#canlist)
    - [.dFilter()](#dfilter)
  - [FilteredList](#filteredlist)
    - [Inherited can.RBTreeList methods](#inherited-canrbtreelist-methods)
    - [Disabled can.RBTreeList methods](#disabled-canrbtreelist-methods)
- [Performance](#performance)
  - [When to Use](#when-to-use)
- [Contributing](#contributing)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Install

Use npm to install `can-derive`:

```
npm install can-derive --save
```

## Use

Use `require` in Node/Browserify workflows to import the `can-derive` plugin
like:

```js
require('can');
require('can-derive');
```

Use `define`, `require`, or `import` in [StealJS](http://stealjs.com/) workflows
to import the `can-derive` plugin like:

```js
import 'can';
import 'can-derive';
```

Once you've imported `can-derive` into your project use
`can.List.dFilter` to generate a derived list based on a `predicate` function.
The following example derives a list of "completed" items from a `can.List`
of `todo` objects:

```js
var todos = new can.List([
    { name: 'Hop', complete: true },
    { name: 'Skip', complete: false },
    //...
]);

var completed = todos.dFilter(function(todo) {
    return todo.attr("complete") === true;
});
```

Any changes to `todos` will be propagated to the derived `completed`
list:

```js
completed.bind('add', function(ev, newItems) {
    console.log(newItems.length, 'item(s) added');
});

todos.push({ name: 'Jump', complete: true },
    { name: 'Sleep', complete: false }); //-> "1 item(s) added"
```

### With can.Map.define

If you're using the [can.Map.define
plugin](http://canjs.com/docs/can.Map.prototype.define.html), you can define a
derived list like so:

```js
{
    define: {
        todos: {
            Value: can.List
        },
        completedTodos: {
            get: function() {
                return this.attr('todos').dFilter(function(todo){
                    return todo.attr('complete') === true;
                });
            }
        }
    }
}
```

Note: The `can-derive` plugin ensures that the define plugin's `get` method will
not observe "length" like it would a traditional [can.List](http://canjs.com/docs/can.List.html)
when calling `.filter()`.


### Accessing FilteredList values

Unlike `can.List` and `Array`, indexes of a `FilteredList` **cannot** be
accessed using bracket notation:

```js
filteredList[1]; //-> undefined
```

To access a `FilteredList`'s values, use [`.attr()`](https://github.com/canjs/can-binarytree#attr):

```js
filteredList.attr(); //-> ["a", "b", "c"]
filteredList.attr(0); //-> "a"
filteredList.attr(1); //-> "b"
filteredList.attr(2); //-> "c"
filteredList.attr('length'); //-> 3
```

This is due to the fact that a `FilteredList` inherits a [`can.RBTreeList`](https://github.com/canjs/can-binarytree#canrbtreelist)
which stores its values in a [Red-black tree](https://en.wikipedia.org/wiki/Red%E2%80%93black_tree)
for [performance](#performance) - rather than a series of numeric keys.


## API

### can.List

#### .dFilter()

`sourceList.filter(predicateFn) -> FilteredList`

Similar to [`.filter()`](https://github.com/canjs/can-derive#filter) except
that the returned `FilteredList` is bound to `sourceList`.

Returns a `FilteredList`.

### FilteredList

#### Inherited can.RBTreeList methods

Since `FilteredList` inherits from [can.RBTreeList](https://github.com/canjs/can-binarytree#canrbtreelist),
the following methods are available:

- [`.attr()`](https://github.com/canjs/can-binarytree#attr)
- [`.each()`](https://github.com/canjs/can-binarytree#each)
- [`.eachNode()`](https://github.com/canjs/can-binarytree#eachnode)
- [`.filter()`](https://github.com/canjs/can-binarytree#filter)
- [`.indexOf()`](https://github.com/canjs/can-binarytree#indexof)
- [`.indexOfNode()`](https://github.com/canjs/can-binarytree#indexofnode)
- [`.map()`](https://github.com/canjs/can-binarytree#map)
- `.slice()` *(coming soon)*

#### Disabled can.RBTreeList methods

A `FilteredList` is bound to its source list and manipulted as it changes.
Because of this, it is read-only and the following `can.RBTreeList`
methods are disabled:

- `.push()`
- `.pop()`
- `.removeAttr()`
- `.replace()`
- `.shift()`
- `.splice()`
- `.unshift()`

## Performance

`can-derive` optimizes for insertions and removals, completing them in `O(log n)`
time. This means that changes to the source list will automatically update the
derived list in `O(log n)` time, compared to the standard `O(n)` time you would
expect in other implementations.

It does this by:

- Keeping the derived list in a [Red-black tree](https://en.wikipedia.org/wiki/Red%E2%80%93black_tree)
  modeled after an `Array`
- Listening for additions or removals in the source list
- Listening for predicate function result changes for any item

This algorithm was originally discussed in [this StackExchange
thread](http://cs.stackexchange.com/questions/43447/order-preserving-update-of-a
-sublist-of-a-list-of-mutable-objects-in-sublinear-t/44502#44502).

### When to Use

In general, it is preferable to use `can-derive` over alternative approaches
when:

- Your source list contains 10 or more elements
- You need to know how the filtered list changed, for instance when rendering
  in the DOM.


## Contributing

To set up your dev environment:

1. Clone and fork this repo.
2. Run `npm install`.
3. Open `list/test.html` in your browser. Everything should pass.
4. Run `npm test`. Everything should pass.
5. Run `npm run-script build`. Everything should build ok
