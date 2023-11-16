---
section: api
title: Routes
order: 2
subsection: Router
active: true
---

# Routes

##### `Routes` is a special `Switch` component that renders the correct `Route` child based on the users' location, and switches between them as the user navigates.

<div class="text-lg">

```tsx twoslash
import { Routes, FileRoutes } from "solid-start";
// ---cut---
<Routes>
  <FileRoutes />
</Routes>
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Defining your own routes

The `<Routes>` component is a control flow component. It can be thought of a special `<Switch>` component. Instead of accepting DOM elements as children, it actually accepts route configuration objects. Our `<Route>` components actually return route configuration objects. The `<Routes>` component merges theses into one big routing configuration. It uses one of Solid's secrets that a component can return anything.

It's up to the parent to decide what to do with the children. It receives `<Route>` components as children that define the various pages of your application. Like a `<Switch>` component, `<Routes>` decides which of its children to render. It uses the `URLPattern` rules against the `path` to match which `<Route>` child to render. And when the user navigates to a different location, this component will switch to the new `<Route>` and render it.

```tsx twoslash {9-13} filename="root.tsx"
// @filename: pages/Home.tsx
export default function Home() {
  return <h1>Home</h1>;
}

// @filename: pages/Users.tsx
export default function Users() {
  return <h1>Users</h1>;
}

// @filename: root.tsx
// ---cut---
import { Routes, Route } from "solid-start";

import Home from "./pages/Home";
import Users from "./pages/Users";

export default function App() {
  return <>
    <h1>My Site with Lots of Pages</h1>
    <Routes>
      <Route path="/" component={Home} />
      <Route path="/users" component={Users} />
      <Route path="/about" element={<div>This site was made with Solid</div>} />
    </Routes>
  </>
}
```

### Using file based routing

Manually importing all your routes can be tedious and error-prone, so, SolidStart gives you file-system routing. This allows you to define the routes via a folder structure under the `/routes` folder. You can pass them into the `<Routes>` component with the `<FileRoutes>` component.

```tsx twoslash {7-9} filename="root.tsx"
import { Html, Body, Routes, FileRoutes } from "solid-start";

export default function Root() {
  return (
    <Html>
      <Body>
        <Routes>
          <FileRoutes />
        </Routes>
      </Body>
    </Html>
  );
}
```

See the [routing guide](/core-concepts/routing) for more details about how to define routes using files.
