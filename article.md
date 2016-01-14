# The derive plugin - A faster way to transform data

## Introduction

The devices you use today to interact with the web communicate, process, and 
store more information more quickly than ever before. Despite this fact 
one factor remains constant: Performance is a product of efficiency. 

## How "change" influences efficiency

- Most API's provide a snapshot of a subset of data, and/or a fire hose
- It's up to JS to manage the relationship between that data and your 
  application's state
- Data transformations like `.sort()`, `.map()`, and `.filter()` are 
  a fast and easy way to manipulate that data into state
- Changes made to the state need to be made to the DOM
- DOM manipulation is expensive (repaint, reflow, etc)
- Efficient DOM manipulation requires that we know *specifically*
  what changed ("add", "remove", "move")
- Determining *specifically* what changed after the fact is inefficient

## How CanJS handles "change" efficiently

In CanJS:

- State is mutable
- State is observable
- Changes to state emit events like: "set", "add", "remove", "move", etc
- The rendering engine is bound to state

What this means is that CanJS' rendering engine inherently knows *specifically* 
how the application state has "changed", which enables it to manipulate the
fewest number of the DOM nodes necessary to reflect each specific state change. 

## Inefficient "change"

Some operations create "change" that isn't inherently apparent. For 
example: 

- `list.filter()`
- `list.sort()`
- `list.map()`

Operations like these are highly inefficient because they "recreate" 
everything from scratch. This has several consequences: 

1. Regardless of the amount of change - whether it be a single property or
   entire list replacement - the same amount of work is re-invested
   to obtain a new result
1. The *specifics* of what "changed" from one result to another are unknown

Because of this, additional work needs to be invested to identify the 
differences between the latest result and the previous result - otherwise
unnecessary DOM manipulations will be made -  thus making the operation 
even more inefficient. 








