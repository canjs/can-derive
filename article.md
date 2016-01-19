# Be proactive, not reactive - Identifying change faster with mutable state

I'm going to show that observing changes on mutable state is
much more efficient than comparing two immutable states
after the change has occurred and therefore much better suited to 
represent a web applications DOM. 

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Mutable state changes](#mutable-state-changes)
- [Immutable state changes](#immutable-state-changes)
- [How changes differ between mutable and immutable state](#how-changes-differ-between-mutable-and-immutable-state)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


## Mutable state changes

Mutable state is an entity with properties that change over time.

- **Instruct** - A change in state is described
- **Overwrite** - Properties are overwritten in-place
- **Dispatch** - Events are dispatched with the description about the change
- **Handle** - The description about the change is passed to the handler


## Immutable state changes

Immutable state is a reference to an entity that cannot change. 

- **Instruct** - A change in state is described
- **Copy** - A copy of the state is made
- **Apply** - Properties are overwritten on the copied state
- **Evaluate** - Recursively compare the copied state to the previous state 
  (===)
- **Handle** - The existance of a change instigates work


## How changes differ between mutable and immutable state

Both mutable and immutable state give the developer the ability to identify 
that a change occured with little overhead (=== is fast). However, only
mutable state can identify the specifics of the the change without additional
overhead. 

| | Detect change | Identify change
|---|---|---|
| Mutable: | <1ms, O(1) | <1ms, O(1)
| Immutable: | <1ms, O(n) | >=1ms, O(n)



## Why the specifics of a change matter

Consider this change:

```
state.get('firstName'); //-> "Christopher"
state.set('firstName', 'Chris'); // ...
```

How we apply the change is dependent on how well we understand the change: 

|   | State changed | An object changed | A property changed
|---|---|---|---|
| Result: | Reload the page | Rerender the component | Update the DOM
| Action: | Make http requests, Load assets, Apply styles, Interpret JS, etc | Render the virtual DOM, Compare to previous virtual DOM, apply patch | Set a property on the DOM node
| Cost: | A lot | A lot less | The least amount possible