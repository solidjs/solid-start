---
section: api
title: useParams
order: 8
subsection: Router
active: true
---

# useParams

##### `useParams` gives you an object containing the path params of the current route.

<div class="text-lg">

```ts twoslash
import { useParams } from "solid-start";
// ---cut---
const params = useParams();
```

</div>

<table-of-contents></table-of-contents>

## Usage

Route params are an important part of the routing system. They allow you to access the dynamic parts of the URL, based on the currently matching [`Route`](/api/router/route).

### Reading `id` param for route `/users/:id`

In our router config, we will usually have a few `Route`'s with dynamic parts. For example, take this router config which has a `Route` with path `/users/:id`.

```tsx twoslash {6}
import { Routes, Route } from "solid-start";

export function App() {
  return (
    <Routes>
      <Route path="/users/:id" />
    </Routes>
  );
}
```

To access the `:id` part of the route, call `useParams()` inside a component. The returned object `params` will have a field `id` that will match the `:id` part of the URL. For example, if the URL is `/users/123`, then `params.id` will be `123`.

```tsx twoslash {4-8}
// @errors: 2571
// @lib: ES2015,DOM

import { useParams } from "solid-start";

function User() {
  const params = useParams<{ id: string }>();

  // when url is /users/123
  console.log(params.id);
  // 123
}
```

### Reading both `id` and `project` params for route `/users/:id/projects/:project`

We could also have a `Route` with multiple dynamic parts. For example, a route with path `/users/:id/projects/:project`. In this case, we would have two params: `id` and `project`.

```tsx twoslash {6-8,14-18}
// @errors: 2571
// @lib: ES2015,DOM
import { JSX } from "solid-js";
import { Routes, Route, useParams } from "solid-start";

export function App() {
  return (
    <Routes>
      <Route path="/users/:id">
        <Route path="/projects/:project" />
      </Route>
    </Routes>
  );
}

function User() {
  const params = useParams<{ id: string; project: string }>();

  // when url is /users/123/projects/hello-world
  console.log(params.id, params.project);
  // 123, hello-world
}
```

### Fetch data based on the path params

The route path parameters are usually used to fetch data from the server based on the current route. For the best user experience with parallel loading of data and route code, you should fetch the data in the `Route`'s data function. The data function is passed the `params` object as an argument.

In some cases, you might want to create async resources within your component tree, outside the `routeData` function. Here, you would need to get the params from the `useParams` hook.

For example, if you have a route like `/users/:id`, then you can access the `id` param by using `useParams` inside your component.

```tsx twoslash {2}
// @errors: 2571
// @lib: ES2015,DOM

import { useParams } from "solid-start";
import { createResource, JSX } from "solid-js";

async function fetchUser(id: string): Promise<{ name: string }> {
  return { name: "John" };
}

// ---cut---
function User() {
  const params = useParams<{ id: string }>();
}
```

Then, you can use the `id` param as the source for your resource. You can fetch data for the user with the matching `id`. For example, here we fetch and render the user's name in your component based on the `id` param.

```tsx twoslash {4-7}
// @lib: ES2015,DOM
// @errors: 2571
import { useParams } from "solid-start";
import { createResource, JSX } from "solid-js";

async function fetchUser(id: string): Promise<{ name: string }> {
  return { name: "John" };
}

// ---cut---
function User() {
  const params = useParams<{ id: string }>();

  // fetch user based on the id path parameter
  const [user] = createResource(() => params.id, fetchUser);

  return <div>{user()?.name}</div>;
}
```

---

## Reference

### `useParams()`

Call `useParams()` inside a component to get the current route params.

```tsx twoslash
import { useParams } from "solid-start";

function Component() {
  const params = useParams();
}
```

#### Returns

A reactive object containing the current route params. The fields of the object are the names of the dynamic parts of the route path. For example,

- If route path is `/users/:id` and URL is `/users/123`,
  - then `params` will be `{ id: 123 }`.
- If route path is `/users/:id/projects/:project` and URL is `/users/123/projects/hello-world`,
  - then `params` will be `{ id: 123, project: "hello-world" }`.
- If route path is `/*missing` and URL is `/no/matching/route`,
  - then `params` will be `{ missing: "no/matching/route" }`.
  - Note: `missing` is not a `string[]` of path segments, but a single `string` containing the whole matched path.
