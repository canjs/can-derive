# The derive plugin - A faster way to transform data


## Introduction

The devices you use today to interact with the web communicate, process, and
store more information quicker than ever before. Despite this fact,
one factor remains constant: Performance is a product of efficiency.

One of the most performance critical features a Javascript application
framework can provide is efficient DOM manipulation. That means making the
fewest number of changes to the DOM possible in order to render a given
application state.

In this article we'll explain how CanJS updates the DOM in both simple and
complex scenarios, what its limitations are, and how our latest investment
in efficiency - the derive plugin - aims to address those issues.


## How state changes become DOM changes

Regardless of the tools or frameworks chosen, most web applications employ
the same basic strategy to construct UI's from application data:

- **Retrieval** - Data is fetched from an API, either as a snapshot of a
  subset of data, and/or a stream of events
- **Processing** - The retrieved data is transformed into application state
  using fast and easy methods like `.sort()`, `.map()`, and `.filter()`
- **Mapping** - The resulting application state is mapped to a DOM
  representation via a templating language
- **Rendering** - A "view" engine manipulates the browser's DOM to
  achieve the desired representation

The "rendering" step plays an enormous role in the responsiveness of your web
application's user interface. It should be no surprise then that this layer of
your stack is significantly complex. Despite this, all view engines work
within the same limitations imposed by the browser:

- DOM manipulation is expensive due to repaints, reflows, etc
- Repaints can be dropped by the browser, resulting in a "locked" or
  "blocking" user interface/experience
- Reading from the DOM is as expensive as writing to the DOM

As a result all view engines operate within similar guidelines:

- Maintaining a Javascript object representation of the DOM is more efficient
  than working directly from the DOM
- The DOM should only be manipulated when the necessary changes are determined -
  intermediate manipulations are wasteful
- DOM manipulations should be as atomic as possible




## How CanJS handles simple changes

In CanJS:

- State is mutable
- State is observable
- Changes to state emit events like: "set", "add", "remove", "move", etc
- The rendering engine is bound to state

What this means is that CanJS's rendering engine inherently knows *specifically*
how the application state has "changed", which enables it to manipulate the
fewest number of the DOM nodes necessary to reflect each specific state change.

In other words, if an item is added to a list, an element is added to the DOM.
If an item is removed from a list, its corresponding DOM element is removed
from the DOM.


## How CanJS handles complex changes

Some operations create "change" that isn't inherently obvious. For
example:

- `list.filter()`
- `list.sort()`
- `list.map()`

Operations like these are highly inefficient because they "recreate"
their results from scratch. This has several consequences:

1. Regardless of the amount of change - whether it be a single property or
   entire list replacement - the same amount of work is required
   to obtain a new result
1. The *specifics* of what "changed" from one result to another are unknown

Because of this, additional work needs to be invested to identify the
differences between the latest result and the previous result - otherwise
unnecessary DOM manipulations will be made - thus making these operations
even more inefficient.


## How the derive plugin handles complex changes