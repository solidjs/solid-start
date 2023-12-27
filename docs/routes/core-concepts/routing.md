---
section: core-concepts
title: Routing
order: 1
active: true
---

# Routing

<table-of-contents></table-of-contents>

Routing is possibly the most important concept to understand in SolidStart. Everything starts with your routes: the compiler, the initial request, and almost every user interaction afterward. In this section, you'll learn how to write basic routes, navigate between routes, and handle more complex/dynamic routing scenarios.

There are two categories of routes:

- UI routes, which define the user interfaces in your app
- [API routes][api-routes], which define data endpoints in your app

This section of the documentation will mainly focus on UI routes, but you can learn more about API routes in the [API Routes][api-routes] section.

## Creating new pages

SolidStart uses file based routing. This means that the directory structure of your routes folder will translate exactly to the route structure in your application.

Files in the `routes` directory will be treated as routes. Directories will be treated as additional route segments. For UI routes, they can be used along with parent layout components to form nested routes.

Here are a few examples of how to arrange files in the `routes` directory to match a given url. (Note: The file extension could be either: `.tsx` or `.jsx` depending on whether or not you are using [TypeScript](https://www.typescriptlang.org/docs/handbook/jsx.html) in your application.)

To create a new route/page in your application, just create a new file in the `routes` directory with the same name.

- `hogwarts.com/blog` ➜ `/routes/blog.tsx`
- `hogwarts.com/contact` ➜ `/routes/contact.tsx`
- `hogwarts.com/directions` ➜ `/routes/directions.tsx`

To create new pages after a given route segment, simply create a directory with the name of the preceding route segment, and create new files in that directory.

- `hogwarts.com/admin/edit-settings` ➜ `/routes/admin/edit-settings.tsx`
- `hogwarts.com/amenities/chamber-of-secrets` ➜ `/routes/amenities/chamber-of-secrets.tsx`
- `hogwarts.com/amenities/quidditch-pitch` ➜ `/routes/amenities/quidditch-pitch.tsx`

Files named `index` will be rendered when there are no additional URL route segments being requested for a matching directory.

- `hogwarts.com` ➜ `/routes/index.tsx`
- `hogwarts.com/admin` ➜ `/routes/admin/index.tsx`
- `hogwarts.com/staff/positions` ➜ `/routes/staff/positions/index.tsx`

Additionally, there are some special file names that map to [URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API) patterns, e.g.

- `hogwarts.com/students/:id` ➜ `/src/routes/students/[id].tsx`
- `hogwarts.com/students/:id/:name` ➜ `/src/routes/students/[id]/[name].tsx`
- `hogwarts.com/*missing` ➜ `/src/routes/[...missing].tsx`

We put all our routes in the same top-level directory, `src/routes`. This includes our pages, but also our [API routes][api-routes]. For a route to be rendered as a page, it should default export a Component. This component represents the content that will be rendered when users visit the page:

```tsx twoslash filename="routes/index.tsx"
export default function Index() {
  return <div>Welcome to Hogwarts!</div>;
}
```

In this example, visiting `hogwarts.com/` will render a `<div>` with the text "Welcome to Hogwarts!" inside it.

Under the hood, SolidStart traverses your `routes` directory, collects all the routes, and makes them accessible using the [`<FileRoutes />`][fileroutes] component. The [`<FileRoutes />`][fileroutes] component only includes your UI routes, and not your API routes. You can use it instead of manually entering all your `Route`s inside the `<Routes />` component in `app.tsx`. Let the compiler do the boring work!

`<FileRoutes>` returns the routing config object so you can use it with the router of your choice. In this example we use `@solidjs/router`.

```tsx twoslash {7-9} filename="app.tsx"
import { Suspense } from "solid-js";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start";

export default function App() {
  return (
    <Router root={props => <Suspense>{props.children}</Suspense>}>
      <FileRoutes />
    </Router>
  );
}
```

This means that all you have to do is create a file in your `routes` folder and SolidStart takes care of everything else needed to make that route available to visit in your application!

## Dynamic routes

Dynamic routes are routes that can match any value for one segment of the route. For example, `/users/1` and `/users/2` are both valid routes. If this is the case for any userId, you can't go around defining separate routes for each user. You need dynamic routes. In SolidStart, dynamic routes are defined using square brackets (`[]`). For example, `/users/[id]` is a dynamic route, where `id` is the dynamic segment.

```tsx {2}
|-- routes/
    |-- users/
        |-- [id].tsx
```

```tsx twoslash filename="routes/users/[id].tsx"
import { useParams } from "@solidjs/router";

export default function UserPage() {
  const params = useParams();
  return <div>User {params.id}</div>;
}
```

## Optional parameter

Optional parameter

matches users and users/123

```tsx {3}
|-- routes/
    |-- users/
        |-- [[id]].tsx
```

## Catch all routes

Catch all routes are routes that can match any value for any number of segments. For example, `/blog/a/b/c` and `/blog/d/e` are both valid routes. You can define catch-all routes using square brackets with `...` before the label for the route.For example, `/blog/[...post]` is a dynamic route, where `post` is the dynamic segment.

`post` will be a property on the `params` object that is returned by the `useParams` hook. It will be a string with the value of the dynamic segment.

```tsx {3}
|-- routes/
    |-- blog/
        |-- index.tsx
        |-- [...post].tsx
```

```tsx twoslash filename="routes/blog/[...post].tsx"
import { useParams } from "@solidjs/router";

export default function BlogPage() {
  const params = useParams();
  return <div>Blog {params.post}</div>;
}
```

## Nested routes

As most UIs evolve, they normally have shared layouts for sections of the app, often driven by the location itself. If you want to add a parent layout to all the children routes in one folder, you can add a file with the same name as that folder, next to that folder itself.

```tsx {1}
|-- routes/
    |-- users.tsx
    |-- users/
        |-- index.tsx
        |-- [id].tsx
        |-- projects.tsx
```

```tsx twoslash filename="routes/users.tsx"
import type { RouteSectionProps } from "@solidjs/router";

export default function UsersLayout(props: RouteSectionProps) {
  return (
    <div>
      <h1>Users</h1>
      {/* insert the child route */ props.children}
    </div>
  );
}
```

## Route Groups

With file system routing, folders map directly to URL Paths. However, there might be times when you want to create folders for the sake of organization without affecting the URL structure. This can be done by using a Route Group. In SolidStart, Route Groups are defined using parenthesis surrounding the folder name `(example)`.

```tsx {1}
|-- routes/
    |-- (static)
        |-- about-us                // example.com/about-us
            |-- index.tsx
        |-- contact-us              // example.com/contact-us
            |-- index.tsx
```

## Renaming Index

By default, the component that is rendered for a route comes from the default export of the `index.tsx` file in each folder. However, this could make it harder to find which `index.tsx` file is the correct one when searching since there will be multiple files with that name. To avoid this pitfall, we also render the default export from any file that follows `(fileName).tsx` syntax.

```tsx {1}
|-- routes/
    |-- (home).tsx                  // example.com
    |-- users.tsx
    |-- users/
        |-- (all-users).tsx         // example.com/users
        |-- [id].tsx
        |-- projects.tsx
```

## Additional Route Config

Sometimes we need more route configuration than can be gleamed off the file convention. For this reason SolidStart's FileSystem router looks for a `route` export. Because you can use different routers with Start you can type it as you see fit and know that the object will be passed along to the route config in `<FileRoutes>`.

```js
import type { RouteSectionProps, RouteDefinition } from "@solidjs/router";

export const route = {
  load() {
    // define load function
  }
} satisfies RouteDefinition

export default function UsersLayout(props: RouteSectionProps) {
  return (
    <div>
      <h1>Users</h1>
      {props.children}
    </div>
  );
}
```

[api-routes]: /core-concepts/api-routes
[fileroutes]: /api/FileRoutes
