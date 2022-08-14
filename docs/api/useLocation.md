# useLocation

##### `useLocation` gives you a reactive object describing the URL the user is visiting

<div class="text-xl">

```ts twoslash
import { useLocation } from "@solidjs/router";
// ---cut---
const location = useLocation();
```

</div>

- [Usage](#usage)

  - [Reading the current URL (location) in a reactive context](#accessing-id-param-for-route-users-id)

- [Reference](#reference)

  - [`useLocation()`](#hello-world)

- [Troublehooting](#troublehooting)

---

## Usage

---

## Reference

### `useLocation()`

Call `useLocation()` inside a component to get the current URL (location).

```tsx twoslash
import { useLocation } from "@solidjs/router";

function Component() {
  const location = useLocation();
}
```

#### Returns

A reactive object containing the attributes of the URL. The fields of the object are the names of the dynamic parts of the route path. For example,

- `pathname: string`: the pathname part of the URL, without the query string,
- `search: string`: the query string part of the URL
- `hash: string`
