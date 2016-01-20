# Be proactive, not reactive - Faster apps with mutable state

I'm going to show that observing changes to a mutable state is
much more efficient than comparing two immutable states
after the change has occurred and therefore much better suited 
to be used in web applications where the cost and frequency 
of DOM manipulation is substantial. 

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [How immutable state handles change](#how-immutable-state-handles-change)
- [How observing mutable state changes compare to immutable state changes](#how-observing-mutable-state-changes-compare-to-immutable-state-changes)
- [Why the details of a change matter](#why-the-details-of-a-change-matter)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


## How immutable state handles change

Immutable state is a reference to an entity that cannot change. 

- **Instruct** - A change in state is described
- **Copy** - A copy of the state is made
- **Apply** - Properties are overwritten on the copied state
- **Evaluate** - Recursively compare the copied state to the previous state 
  (===)
- **Handle** - The existance of a change instigates work

Using this approach, its easy to identify that a change has occured and 
naively redo some subset of the overall work to reconsile the difference 
between the state and the DOM. 

## How observing mutable state changes compare to immutable state changes

Mutable state is an entity with properties that change over time.

- **Instruct** - A change in state is described
- **Overwrite** - Properties are overwritten in-place
- **Dispatch** - Events are dispatched with the details about the change
- **Handle** - The details about the change is passed to the handler

Using this approach, its easy to apply logic based on the details of the 
change and intelligently redo only the necessary amount of work that is 
required to reconsile the difference between the state and the DOM.


## Why the details of a change matter

Consider this example:

```
var todos = [
  { title: 'Hop', completed: true },
  { title: 'Skip', completed: false },
  { title: 'Jump', completed: false }
];

var completed = todos.filter(function (todo) {
  return todo.completed;
})
```

Later:

```
todos.push({ title: 'Sleep', completed: false });
```

How we reconsile the change is dependent on what details we have about
the change: 

|   | State changed | An object changed | A property changed
|---|---|---|---|
| Result: | Reload the page | Rerender the component | Update the DOM
| Action: | Make http requests, Load assets, Apply styles, Interpret JS, etc | Render the virtual DOM, Compare to previous virtual DOM, apply patch | Append a DOM node
| Cost: | A lot | A lot less | The least amount possible