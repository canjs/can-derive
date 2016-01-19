# Be proactive, not reactive - Identifying change faster using mutable state

I'm going to show that observing changes on mutable state is
much more efficient than comparing two immutable states
after the change has occurred.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Why it's important to know "what changed"](#why-its-important-to-know-what-changed)
- [What is mutable state](#what-is-mutable-state)
    - [Identifying change](#identifying-change)
- [What is immutable state](#what-is-immutable-state)
    - [Identifying change](#identifying-change-1)
- [Why changes to mutable state are faster](#why-changes-to-mutable-state-are-faster)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Why it's important to know "what changed"

- Efficient DOM manipulation
- Dependent properties/values
- Debugging

## What is mutable state 

Mutable state is an entity with properties that change over time.

#### Identifying change

- **Overwrite** - The values are overwritten in-place
- **Dispatch** - Events are dispatched with metadata about the change
- **Handle** - Specifics about the change are passed to the handler

## What is immutable state

Immutable state is a reference to an entity that cannot change. 

#### Identifying change

- **Copy** - A copy of the state is made
- **Apply** - The change is made to the copied state
- **Evaluate** - Recursively compare the copied state to the previous state 
  (===)

## Why changes to mutable state are faster

- **No copying** - Re-use what already exists
- **No diff'ing** - Changes are known inherently
- **No re-work** - Updates, not reproductions