---
section: api
title: Route
order: 3
subsection: Router
---

# Routes

##### `Routes` is a component that renders the matched route component

<div class="text-lg">

```tsx twoslash
import { Routes, FileRoutes } from "solid-start";
// ---cut---
<Routes><FileRoutes /></Routes>
```

</div>

<table-of-contents></table-of-contents>

## Usage

```tsx twoslash filename="root.tsx"
// @filename: pages/Home.tsx
export default function Home() {
  return <div>Home</div>;
}

// @filename: pages/Users.tsx
export default function About() {
  return <div>About</div>;
}

// @filename: root.tsx
// ---cut---
import { Routes, Route } from "solid-start"

import Home from "./pages/Home"
import Users from "./pages/Users"

export default function RootLayout() {
  return (
    <>
      <h1>My Site with Lots of Pages</h1>
      <Routes>
        <Route path="/" component={Home} />
        <Route path="/users" component={Users} />
        <Route path="/about" element={<div>This site was made with Solid</div>} />
      </Routes>
    </>
  );
}
```

The `<Route>` component allows the manual registration of routes when added as children to the `<Routes>` component. It is a re-export from `@solidjs/router`. If only using file system routing you probably will not need any of the information on this page. But it can serve as a reference to how this works under the hood.

### Route Props

<table>
  <tr><th>Prop</th><th>Type</th><th>Description</th></tr>
  <tr><td>path</td><td>string</td><td>The path segment for this portion of the route.</td></tr>
  <tr><td>component</td><td>function</td><td>A component definition to be instantiated on route match. Only one of `element` or `component` should be present.</td></tr>
  <tr><td>element</td><td>unknown</td><td>The element defines a expression that is run when the route is matched. Generally this is an instantiated component. Only one of `element` or `component` should be present.</td></tr>
  <tr><td>data</td><td>function</td><td>Method for registering data loading functions that run in parallel on route match.</td></tr>
</table>

## Dynamic Routes

If you don't know the path ahead of time, you might want to treat part of the path as a flexible parameter that is passed on to the component. 

```tsx twoslash filename="root.tsx"
// @filename: pages/Home.tsx
export default function Home() {
  return <div>Home</div>;
}

// @filename: pages/Users.tsx
export default function Users() {
  return <div>About</div>;
}


// @filename: pages/User.tsx
export default function User() {
  return <div>User</div>;
}

// @filename: root.tsx
// ---cut---

import { lazy } from "solid-js";
import { Routes, Route } from "solid-start"

const Users = lazy(() => import("./pages/Users"));
const User = lazy(() => import("./pages/User"));
const Home = lazy(() => import("./pages/Home"));

export default function RootLayout() {
  return <>
    <h1>My Site with Lots of Pages</h1>
    <Routes>
      <Route path="/users" component={Users} />
      <Route path="/users/:id" component={User} />
      <Route path="/" component={Home} />
      <Route path="/about" element={<div>This site was made with Solid</div>} />
    </Routes>
  </>
}
```

or with file-system routing:

```tsx
|-- routes
|   |-- index.tsx
|   |-- users
|   |   |-- [id].tsx
|   |   |-- index.tsx
|   |-- about.tsx
|-- root.tsx
```

The colon indicates that `id` can be any string, and as long as the URL fits that pattern, the `User` component will show.

You can then access that `id` from within a route component with `useParams`:


```jsx
//async fetching function
import { fetchUser } from "api"

export default function User () {

  const params = useParams();

  const [userData] = createResource(() => params.id, fetchUser);

  return <A href={userData.twitter}>{userData.name}</A>
}
```

### Optional Parameters

Parameters can be specified as optional by adding a question mark to the end of the parameter name:

```jsx
//Matches stories and stories/123 but not stories/123/comments
<Route path='/stories/:id?' element={<Stories/>} />
```

### Wildcard Routes

`:param` lets you match an arbitrary name at that point in the path. You can use `*` to match any end of the path:

```jsx
//Matches any path that begins with foo, including foo/, foo/a/, foo/a/b/c
<Route path='foo/*' component={Foo}/>
```

If you want to expose the wild part of the path to the component as a parameter, you can name it:

```tsx twoslash filename="routes/foo/[...any].tsx"
const Stories = () => <div>Stories</div>
// ---cut---
export default () => <Stories />
```


```jsx
<Route path='foo/*any' element={<div>{useParams().any}</div>}/>
```

Note that the wildcard token must be the last part of the path; `foo/*any/bar` won't create any routes.

### Multiple Paths

Routes also support defining multiple paths using an array. This allows a route to remain mounted and not rerender when switching between two or more locations that it matches:

```jsx
//Navigating from login to register does not cause the Login component to re-render
<Route path={["login", "register"]} component={Login}/>
```

## Route Data Functions
In the [above example](#dynamic-routes), the User component is lazy-loaded and then the data is fetched. With route data functions, we can instead start fetching the data parallel to loading the route, so we can use the data as soon as possible.

To do this, create a function that fetches and returns the data using `createResource`. Then pass that function to the `data` prop of the `Route` component. 


```js
import { lazy } from "solid-js";
import { Route } from "solid-start";
import { fetchUser } ...

const User = lazy(() => import("./pages/users/[id].js"));

//Data function
function UserData({params, location, navigate, data}) {
  const [user] = createResource(() => params.id, fetchUser);
  return user;
}

//Pass it in the route definition
<Route path="/users/:id" component={User} data={UserData} />;
```

When the route is loaded, the data function is called, and the result can be accessed by calling `useRouteData()` in the route component.

```jsx
//pages/users/[id].js
import { useRouteData } from 'solid-start';
export default function User() {
  const user = useRouteData();
  return <h1>{user().name}</h1>;
}
```

## Nested Routes
The following two route definitions have the same result:

```jsx
<Route path="/users/:id" component={User} />
```
```jsx
<Route path="/users">
  <Route path="/:id" component={User} />
</Route>
```
`/users/:id` renders the `<User/>` component, and `/users/` is an empty route.

Only leaf Route nodes (innermost `Route` components) are given a route. If you want to make the parent its own route, you have to specify it separately:

```jsx
//This won't work the way you'd expect
<Route path="/users" component={Users}>
  <Route path="/:id" component={User} />
</Route>

//This works
<Route path="/users" component={Users} />
<Route path="/users/:id" component={User} />

//This also works
<Route path="/users">
  <Route path="/" component={Users} />
  <Route path="/:id" component={User} />
</Route>
```


