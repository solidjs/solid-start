---
section: api
title: useNavigate
order: 8
subsection: Router
active: true
---

# useNavigate

##### `useNavigate` provides a function for navigating routes.

<div class="text-xl">

```ts
import { useNavigate } from "solid-start";
// ---cut---
const navigate = useNavigate();
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Navigating to a new route

You can use `useNavigate` inside the main component body to get a `navigate` function you can use in any of your event handlers or reactive updates.

```js
import { useNavigate } from "solid-start";

function Component() {
  const navigate = useNavigate();

  const handleClick = () => {
    // do some stuff then...
    navigate("/home");
  }

  return <button onClick={handleClick}>Do Something</button>
}
```

### Replacing the current route

Sometimes you want to replace the current place in the navigation history. You can do that by setting the `replace` option to `true`.

```js
const navigate = useNavigate();

if (unauthorized) {
  navigate("/login", { replace: true });
}
```

## Reference

### `useNavigate()`

Call `useNavigate()` inside a component to get a function you can use to navigate.

```tsx twoslash
import { useNavigate } from "solid-start";

function Component() {
  const navigate = useNavigate();
}
```

#### Returns

A function to do route navigation. The method accepts a path to navigate to and an optional object with the following options:

- `resolve` (_boolean_, default `true`): resolve the path against the current route.
- `replace` (_boolean_, default `false`): replace the history entry.
- `scroll` (_boolean_, default `true`): scroll to top after navigation.
- `state` (_any_, default `undefined`): pass custom state to `location.state`.

__Note:__ The state is serialized using the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) which does not support all object types.

