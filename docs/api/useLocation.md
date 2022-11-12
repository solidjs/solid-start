---
section: api
title: useLocation
order: 8
subsection: Router
active: true
---

# useLocation

##### `useLocation` gives you a reactive object describing the URL the user is visiting.

<div class="text-lg">

```ts twoslash
import { useLocation } from "solid-start";
// ---cut---
const location = useLocation();
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Getting a reactive object describing the current URL location

The `useLocation` hook gives you a reactive object describing the current URL location. It is a wrapper around the [Location](https://developer.mozilla.org/en-US/docs/Web/API/Location) object from the browser. Since it's a store, you can use it in any reactive context, and you will be subscribed to changes to that part of the URL.

```tsx twoslash {4,6}
import { useLocation } from "solid-start";

function Location() {
  const location = useLocation();

  console.log(location.pathname); // /users/123
  console.log(location.search); // ?sort=name
  console.log(location.hash); // #top
}
```

If you want to use the `search` part, you should use the [`useSearchParams`][usesearchparams] hook instead. It gives you much better control over the search string.

## Reference

### `useLocation()`

Call `useLocation()` inside a component to get the current URL (location).

```tsx twoslash
import { useLocation } from "solid-start";

function Component() {
  const location = useLocation();
}
```

#### Returns

A [reactive object][reactivity] containing the attributes of the current location (URL):

- `pathname` (_string_): the pathname part of the URL, without the query string.
- `search` (_string_): the query string part of the URL.
- `hash` (_string_): the hash part of the URL, including the `#`.

[reactivity]: /api/reactivity
[usesearchparams]: /api/useSearchParams
