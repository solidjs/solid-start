---
section: api
title: createServerData$
order: 8
subsection: Data
active: true
---

# createServerData$

##### `createServerData$` allows you to manage async data fetching always on the server

<div class="text-lg">

```tsx twoslash
import { createServerData$ } from "solid-start/server";
function getStudents() {
  return [];
}
// ---cut---
const data = createServerData$(getStudents);
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Fetching data from a Database

`createServerData$` is a primitive for managing async data fetching that always runs on the server. It is a light wrapper over `createRouteData` that leverages `server$` functions to ensure the fetcher always runs on the server. This allows you access things only available on the server like databases.

```tsx twoslash
const prisma = {
  students: {
    findMany() {}
  }
};
// ---cut---
import { createServerData$ } from "solid-start/server";

export function routeData() {
  return createServerData$(() => prisma.students.findMany());
}
```

### Fetching data with a key

Often though we want to be able set a key for our routeData both to act as a parameter and to allow easy invalidation. The fetcher function is not reactive so you must use this option if you wish the route data to update. It is also the only way to pass parameters to fetcher function for `createServerData$` as only variables at top-level scope or passed in can be accessed in `server$` functions.

```tsx twoslash
const prisma = {
  students: {
    findUnique(p: { where: { id: string } }) {}
  }
};
// ---cut---
import { RouteDataArgs } from "solid-start";
import { createServerData$ } from "solid-start/server";

export function routeData({ params }: RouteDataArgs) {
  return createServerData$(
    ([, id]) => prisma.students.findUnique({ where: { id } }),
    { key: () => ["students", params.id] }
  );
}
```

### Acessing the `Request`

```tsx twoslash
const prisma = {
  students: {
    findUnique(p: { where: { id: string } }) {}
  }
};
function isLoggedIn(req: Request) { return true }
// ---cut---
import { RouteDataArgs } from "solid-start";
import { createServerData$, redirect } from "solid-start/server";

export function routeData({ params }: RouteDataArgs) {
  return createServerData$(
    async ([, id], { request }) => {
      if (!isLoggedIn(request)) throw redirect("/login");

      return prisma.students.findUnique({ where: { id } })
    },
    { key: () => ["students", params.id] }
  );
}
```

## Reference

See [createRouteData](./createRouteData) for full API reference.
