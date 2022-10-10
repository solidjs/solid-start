---
section: api
title: createRouteData/ServerData$
order: 8
subsection: Data
active: true
---

# createRouteData/createServerData$

##### `createRouteData/createServerData$` allows you to manage async data fetching

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

`createRouteData` is a primitive for managing async data fetching. It is a light wrapper over `createResource` that is router away so it can handle data refetching. The simplest way to use it is to fetch data from an API.

```tsx twoslash
import { createRouteData } from "solid-start";

export function routeData() {
  return createRouteData(async () => {
    const response = await fetch("https://hogwarts.deno.dev/students");
    return (await response.json());
  });
}
```

### Fetching data from a Database

`createServerData$` is the equivalent to `createRouteData` except it always runs its function on the server, even when instantiated in the browser. It does so using SolidStart's `server$` function internally. This allows you access things only available on the server like databases.

```tsx twoslash
const prisma = {
  students: {
    findMany() {}
  }
}
// ---cut---
import { createServerData$ } from "solid-start/server";

export function routeData() {
  return createServerData$(async () => await prisma.students.findMany());
}
```

### Fetching data with a key

Often though we want to be able set a key for our routeData both to act as a parameter and to allow easy invalidation.

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

### Setting the reconcile key

`createRouteData` uses a Solid Store under the hood to store its data. This means that when data is refetched it attempts to diff the data to trigger only the finest-grained updates. By default it is configured to key data to `id`. If your backend uses a different field you can set it:

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

Call `createRouteData()` .

```tsx twoslash
function getStudents() {
  return [];
}
// ---cut---
import { createRouteData } from "solid-start";

export function routeData() {
  return createRouteData(getStudents);
}
```

#### Options

- key (_string | Array_, default: true): Parameters for the route data to key by. A falsy value prevents fetching.
- initialValue (_unknown_, default `undefined`): Initial value of the routeData
- deferStream (_boolean_, default `false`): Prevent streaming render from flushing until complete
- reconcileOptions
  - key (_string_, default `"id"`): The property to use as a key for data diffing.
  - merge (_boolean_, default `false`): When true diff deep merges unrecognized values instead of replacing them.
#### Returns

A Solid Resource. An accessor that returns the data that additionally has these reactive properties:

- state (_"unresolved" | "pending" | "ready" | "refreshing" | "errored"_): Current state of the route data.
- loading (_boolean_): Indicates if it is loading.
- error (_unknown_): Contains the error if it is currently errored.
- latest (_unknown_): A way of reading the current value without triggering `Suspense`.