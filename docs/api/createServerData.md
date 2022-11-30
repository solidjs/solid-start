---
section: api
title: createServerData$
order: 8
subsection: Data
active: true
---

# createServerData$

##### `createServerData$` allows you to manage async data fetching always on the server.

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

`createServerData$` is a primitive for managing async data fetching that always runs on the server. It is a light wrapper over `createRouteData` that leverages `server$` functions to ensure the fetcher always runs on the server. This allows you to access things only available on the server like databases.

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

Often though we want to be able to set a key for our routeData both to act as a parameter and to allow easy invalidation. The fetcher function is not reactive, so you must use this option if you wish the route data to update. It is also the only way to pass parameters to fetcher function for `createServerData$` as only variables at top-level scope or passed in can be accessed in `server$` functions.

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

### Accessing the `Request`

```tsx twoslash {7}
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
      if (!isLoggedIn(request)) {
        throw redirect("/login");
      }

      return prisma.students.findUnique({ where: { id } })
    },
    { key: () => ["students", params.id] }
  );
}
```

## Reference

See [createRouteData](./createRouteData) for full API reference.

There are a few constraints that must be met for `createServerData$` to work correctly:

### Serializing 
All values passed in the `key` must be JSON serializable. When the fetcher function is called from the client, the key is sent to the server and used to look up the data. If the key is not serializable, it will not be sent properly to the server. 

That means, that you shouldn't pass in functions or accessors like signals. You should call the accessors in the `key` function itself. Since `key` is a function it will make things reactive and call the fetcher with actual values instead of accessors. The fetcher function is not reactive, so reading from signals does not subscribe to them.

The data returned from the fetcher function must also be JSON serializable object or a `Response` object.

```tsx twoslash {7} bad
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
    ([id]) => prisma.students.findUnique({ where: { id: id() } }),
    { key: () => [() => params.id] } // cant pass a function, not serializable
  );
}

```

```tsx twoslash {7} good
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
    ([id]) => prisma.students.findUnique({ where: { id } }),
    { key: () => [params.id] } // read the reactive value in the key function
  );
}

```

### Hoisting 

The fetcher function must not access anything in its surrounding scope/closure. Since the function is run in an isolated environment, we hoist it out from wherever it's declared to the top of the file. It only has access to variables defined at the module level and the arguments passed in. Nothing else. This is why you must pass in any variables you need to access in the fetcher function as arguments, not just the reactive ones.


```tsx twoslash {4,6} bad
const prisma = {
  students: {
    findUnique(p: { where: { house: string } }) {}
  }
};

// ---cut---
import { createServerData$ } from "solid-start/server";

export function routeData() {
  let house = 'gryffindor'; // can't use this inside the fetcher function
  return createServerData$(
    () => prisma.students.findUnique({ where: { house } }),
    { key: () => ["students"] }
  );
}
```

```tsx twoslash {6} good
const prisma = {
  students: {
    findUnique(p: { where: { house: string } }) {}
  }
};

// ---cut---
import { createServerData$ } from "solid-start/server";

export function routeData() {
  return createServerData$(
    () => {
      let house = 'gryffindor'; // if you can, just declare it inside the function
      return prisma.students.findUnique({ where: { house } });
    },
    { key: () => ["students"] }
  );
}
```

```tsx twoslash {3} good
const prisma = {
  students: {
    findUnique(p: { where: { house: string } }) {}
  }
};

// ---cut---
import { createServerData$ } from "solid-start/server";

let house = 'gryffindor'; // see if it can be extracted to module scope

export function routeData() {
  return createServerData$(
    () => {
      return prisma.students.findUnique({ where: { house } });
    },
    { key: () => ["students"] }
  );
}
```

```tsx twoslash {4,6,9} good
const prisma = {
  students: {
    findUnique(p: { where: { house: string } }) {}
  }
};

// ---cut---
import { createServerData$ } from "solid-start/server";

export function routeData() {
  let house = 'gryffindor';
  return createServerData$(
    ([, house]) => {
      return prisma.students.findUnique({ where: { house } });
    },
    { key: () => ["students", house] } // pass in to the function using the key
  );
}
```

## Reference

Refer to [createRouteData](./createRouteData) for API reference.

