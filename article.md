# The derive plugin - A faster way to transform data

## Introduction

The devices you use today to interact with the web communicate, process, and
store more information quicker than ever before. Despite this fact,
one factor remains constant: Performance is a product of efficiency.

One of the most performance critical things a Javascript application can do
is update the DOM efficiently. That means making the fewest number of DOM
manipulations necessary to render a given application state.

In this article we'll explain how CanJS updates the DOM in both simple and
complex scenarios, what its limitations are, and how the derive plugin aims
to address those issues.


## How state changes become DOM changes

- Most back end API's provide a snapshot of a subset of data, and/or
  a stream of events
- It's up to JS to manage the relationship between that data and your
  application's state
- Data transformations like `.sort()`, `.map()`, and `.filter()` are
  a fast and easy way to manipulate that data into state
- Changes made to the state need to be made to the DOM
- DOM manipulation is expensive (repaint, reflow, etc)
- Efficient DOM manipulation requires that we know *specifically*
  what changed ("add", "remove", "move")
- Determining *specifically* what changed after the fact is inefficient
  (diffing)

## How CanJS handles simple changes

In CanJS:

- State is mutable
- State is observable
- Changes to state emit events like: "set", "add", "remove", "move", etc
- The rendering engine is bound to state

What this means is that CanJS's rendering engine inherently knows *specifically*
how the application state has "changed", which enables it to manipulate the
fewest number of the DOM nodes necessary to reflect each specific state change.

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