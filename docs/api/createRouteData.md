---
section: api
title: createRouteData
order: 8
subsection: Data
active: true
---

# createRouteData

##### `createRouteData` allows you to manage async data fetching.

<div class="text-lg">

```tsx twoslash
import { createRouteData } from "solid-start";

function getStudents() {
  return [];
}
// ---cut---
const data = createRouteData(getStudents);
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Fetching data from an API

`createRouteData` is a primitive for managing async data fetching. It is a light wrapper over `createResource` that is a router away so it can handle data refetching. The simplest way to use it is to fetch data from an API.

```tsx twoslash
import { createRouteData } from "solid-start";

export function routeData() {
  return createRouteData(async () => {
    const response = await fetch("https://hogwarts.deno.dev/students");
    return (await response.json());
  });
}
```

### Fetching data with a key

Often though we want to be able to set a `key` for our routeData both to act as a parameter and to allow easy invalidation. The fetcher function does not reactively track, so you must use this option if you wish the route data to update. A "falsy" value turns off data fetching.

```tsx twoslash
import { createRouteData, RouteDataArgs } from "solid-start";

export function routeData({ params } : RouteDataArgs) {
  return createRouteData(
    async key => {
      const response = await fetch(`https://hogwarts.deno.dev/${key[0]}/${key[1]}`);
      return (await response.json());
    },
    { key: () => ["students", params.id] }
  );
}
```

### Reactive Keys

The array returned by the `key` function can track signals and automatically refetch data when the key changes. One use case for this is refetching data based on when a query param changes (since query param changes don't actually register as a changed route). Consider the following example which implements basic pagination using an `after` query param:

```tsx twoslash
import { createRouteData, RouteDataArgs } from "solid-start";

export function routeData({ params, location } : RouteDataArgs) {
  return createRouteData(
    async ([, after]) => {
      const response = await fetch(`https://hogwarts.deno.dev/students?after${after}`);
      return (await response.json());
    },
    { key: () => ["students", location.query['after']] }
  );
}
```

### Setting the reconcile key

`createRouteData` uses a Solid Store under the hood to store its data. This means that when data is refetched it attempts to diff the data to trigger only the finest-grained updates. By default, it is configured to key data to `id`. If your backend uses a different field you can set it:

```tsx twoslash
import { createRouteData } from "solid-start";

export function routeData() {
  return createRouteData(
    async () => {
      const response = await fetch("https://hogwarts.deno.dev/students");
      return (await response.json());
    },
    {
      reconcileOptions: {
        key: "_id"
      }
    }
  );
}
```

## Reference

### `createRouteData(fetcher, options)`

Call `createRouteData()`.

```tsx twoslash
function getStudents() {
  return [];
}
// ---cut---
import { createRouteData } from "solid-start";

export function routeData() {
  const data = createRouteData(getStudents);

  data() // null, data is not yet loaded, triggers Suspense
  data.loading // true, data is loading
  data.latest // null, data is not yet loaded
}
```

#### Options

- `key` (_string | Array_, default: true): Parameters for the route data to key by. A falsy value prevents fetching.
- `initialValue` (_unknown_, default `undefined`): Initial value of the routeData.
- `deferStream` (_boolean_, default `false`): Prevent streaming render from flushing until complete.
- `reconcileOptions`:
  - `key` (_string_, default `"id"`): The property to use as a key for data diffing.
  - `merge` (_boolean_, default `false`): When true diff deep merges unrecognized values instead of replacing them.

#### Returns

A Solid [Resource][Resource]. An accessor that returns the data loaded by the fetcher. The accessor additionally has these reactive properties:

- `state` (_"unresolved" | "pending" | "ready" | "refreshing" | "errored"_): Current state of the route data.
- `loading` (_boolean_): Indicates if it is loading.
- `error` (_unknown_): Contains the error if it is currently errored.
- `latest` (_unknown_): A way of reading the current value without triggering [`Suspense`][Suspense].

[Resource]: https://www.solidjs.com/docs/latest/api#createresource
[Suspense]: https://www.solidjs.com/docs/latest/api#suspense
