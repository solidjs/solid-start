---
section: api
title: useRouteData
order: 8
subsection: Data
active: true
---

# useRouteData

##### `useRouteData` gives you the data defined for the route.

<div class="text-lg">

```ts twoslash
import { useRouteData } from "solid-start";
// ---cut---
const data = useRouteData();
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Retrieving data from the routeData function

SolidStart's file system routing allows components defined under the `/routes` to define a `routeData` function that executes when navigation begins to that component. It does so in parallel to loading the code for it.

You can use whatever is returned from the `routeData` function in your component by calling `useRouteData`.

```ts twoslash
let fetchUsers = async () => ({ name: "Harry Potter" });
// ---cut---
import { createResource } from "solid-js";
import { useRouteData, RouteDataArgs } from "solid-start";

export function routeData({ params }: RouteDataArgs) {
  // load some data
  const [users] = createResource(fetchUsers);
  return users;
}

export default function Component() {
  const users = useRouteData<typeof routeData>();
}
```

## Reference

### `useRouteData()`

Call `useRouteData()` inside a component to get the data from the nearest ancestor route section.

```tsx twoslash
import { useRouteData } from "solid-start";

function Component() {
  const data = useRouteData();
}
```

#### Returns

Whatever is returned by the nearest ancestor `routeData` function.