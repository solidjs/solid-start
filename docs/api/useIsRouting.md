---
section: api
title: useIsRouting
order: 8
subsection: Router
active: true
---

# useIsRouting

##### `useIsRouting` gives you a signal for when the router is routing.

<div class="text-lg">

```tsx twoslash
import { useIsRouting } from 'solid-start'
// ---cut---
const isRouting = useIsRouting()
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Getting a signal indicating whether the router navigation is in progress

`useIsRouting` returns a signal that is true when the router is changing to the next route, and false otherwise. It does so by tapping into Solid's Transitions. This signal is not set on initial page render but on any subsequent navigation.

```js
const isRouting = useIsRouting();

return (
  <div classList={{ "grey-out": isRouting() }}>
    <MyAwesomeContent />
  </div>
);
```

It is intended to be used to show that the current page is stale, and will be leaving view. Once the new page has been transitioned to the signal is set to false. The new page may not be fully loaded at this time as any nested Suspense boundary may still be loading when the route transition has ended.

## Reference

### `useIsRouting()`

Call `useIsRouting()` inside a component to get a signal to indicate the router is transitioning.

```tsx twoslash
import { useIsRouting } from "solid-start";

function Component() {
  const isRouting = useIsRouting();
}
```

#### Returns

A signal which contains a boolean value.
