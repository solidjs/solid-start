---
section: api
title: Outlet
order: 8
subsection: Router
---

# Outlet

The `<Outlet>` component is used to indicate where child routes should be inserted into the parent when using nested routing. This is how one can achieve shared layouts that aren't replaced when navigating between pages. `<Outlet>` is a re-export from `@solidjs/router`.

```jsx

import { Outlet } from "@solidjs/router";

function PageWrapper () {
  return <div>
    <h1> We love our users! </h1>
    <Outlet/>
    <A href="/">Back Home</A>
  </div>
}

<Route path="/users" component={PageWrapper}>
  <Route path="/" component={Users}/>
  <Route path="/:id" component={User} />
</Route>
```
Now our `/users` and `/users/:id` routes share a layout as each nested route elements will appear inside the parent element at the location where the `<Outlet/>` was declared.

You can nest indefinitely - just remember that only leaf nodes will become their own routes. In this example, the only route created is `/layer1/layer2`, and it appears as three nested divs.

```jsx
<Route path='/' element={<div>Onion starts here <Outlet /></div>}>
  <Route path='layer1' element={<div>Another layer <Outlet /></div>}>
    <Route path='layer2' element={<div>Innermost layer</div>}></Route>
  </Route>
</Route>
```
