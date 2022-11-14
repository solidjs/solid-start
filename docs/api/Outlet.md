---
section: api
title: Outlet
order: 8
subsection: Router
active: true
---

# Outlet

##### `Outlet` is a component that renders the matched child route component inside a layout component.

<div class="text-lg">

```tsx twoslash
import { Outlet } from "solid-start";
// ---cut---
<Outlet />
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Rendering the matched child route component inside a layout route component

The `<Outlet>` component is used to indicate where child routes should be inserted into the parent when using nested routing. This is how one can achieve shared layouts that aren't replaced when navigating between pages. `<Outlet>` is a re-export from `@solidjs/router`.

```tsx twoslash filename="routes/users/index.tsx"
export default () => <div>Users</div>;
```

```tsx twoslash filename="routes/users/[id].tsx"
export default () => <div>User</div>;
```

```tsx twoslash filename="routes/users.tsx"
// ---cut---
import { Outlet, A } from "solid-start";

export default function UsersLayout() {
  return (
    <div>
      <h1> We love our users! </h1>
      <Outlet/>
      <A href="/">Back Home</A>
    </div>
  );
}
```

```tsx twoslash filename="routes.tsx"
// ---cut---
import { Route } from "solid-start";

export default function OurRoutes() {
  return (
    <Route path="/users">
      <Route path="/" />
      <Route path="/:id" />  
    </Route>
  );
}
```

Now our `/users` and `/users/:id` routes share a layout as each nested route elements will appear inside the parent element at the location where the `<Outlet/>` was declared.

You can nest indefinitely but remember that only leaf nodes will become their own routes. In this example, the only route created is `/layer1/layer2`, and it appears as three nested divs.

```tsx twoslash filename="routes.tsx"
// ---cut---
import { Route, Outlet } from "solid-start";

export default function OurRoutes() {
  return (
    <Route path='/' element={<div>Onion starts here <Outlet /></div>}>
      <Route path='layer1' element={<div>Another layer <Outlet /></div>}>
        <Route path='layer2' element={<div>Innermost layer</div>}></Route>
      </Route>
    </Route>
  );
}
```
