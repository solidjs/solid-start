---
section: api
title: useMatch
order: 8
subsection: Router
active: true
---

# useMatch

##### `useMatch` returns a signal indicating that the current location matches.

<div class="text-lg">

```ts twoslash
import { useMatch } from "solid-start";
// ---cut---
const match = useMatch(() => "/my-route");
```
</div>

<table-of-contents></table-of-contents>

## Usage

### Determining if a given path matches the current route

`useMatch` takes a function that returns the path and returns a signal with match information if the current path matches the provided path. We can use this to determine if a given path matches the current route.

```js
const match = useMatch(() => routeOfInterest);

return <div classList={{ active: Boolean(match()) }} />;
```

## Reference

### `useMatch()`

Call `useMatch()` inside a component to get the current URL (location).

```tsx twoslash
import { useMatch } from "solid-start";

function Component() {
  const match = useMatch(() => "/path/to/somewhere");
}
```

#### Returns

Either undefined if not matched **or** a reactive object containing the attributes of the match:

- `path` (_string_): the pathname part of the URL, without the query string.
- `params` (_reactive object_): object containing key value pairs of dynamic route sections.
