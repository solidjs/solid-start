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

## Creating pages

SolidStart uses file based routing. This means that the directory structure of your routes folder will translate exactly to the route structure in your application.

Files in the `routes` directory will be treated as routes. Directories will be treated as additional route segments. For UI routes, they can be used along with parent layout components to form nested routes.

Here are a few examples of files in our directory structure and how they would translate to routes:

- `/src/routes/index.tsx` ➜ `hogwarts.com/`
- `/src/routes/admin/index.tsx` ➜ `hogwarts.com/admin`
- `/src/routes/admin/edit-settings.tsx` ➜ `hogwarts.com/admin/edit-settings`

There are some special file names that map to `URLPattern` patterns, e.g.
- `/src/routes/students/[id].tsx` ➜ `hogwarts.com/students/:id`
- `/src/routes/students/[id]/[name].tsx` ➜ `hogwarts.com/students/:id/:name`
- `/src/routes/[...missing].tsx` ➜ `hogwarts.com/*missing`


We put all our routes in the same top-level directory, `src/routes`. This includes our pages, but also our [API routes][api-routes]. For a route to be rendered as a page, it should default export a [Component][components]. This component represents the content that will be rendered when users visit the page:

```tsx twoslash filename="routes/index.tsx"
export default function Index() {
  return <div>Welcome to Hogwarts!</div>;
}
```

In this example, visiting `hogwarts.com/` will render a `<div>` with the text "Welcome to Hogwarts!" inside it.

Under the hood, SolidStart traverses your `routes` directory, collects all the routes, and makes them accessible using the [`<FileRoutes />`][fileroutes] component. The [`<FileRoutes />`][fileroutes] component only includes your UI routes, and not your API routes. You can use it instead of manually entering all your `Route`s inside the `<Routes />` component in `root.tsx`. Let the compiler do the boring work!

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

This means that all you have to do is create a file in your `routes` folder and SolidStart takes care of everything else needed to make that route available to visit in your application!

## Navigating between pages

While the user can enter your app from any route, once they are in, you can provide them a designed user experience. You need a way for the user to travel between your routes. The HTML spec has the [`<a>`][nativea] tag for this purpose. You can use [`<a>`][nativea] tags to add links between pages in your app. Nothing special. That will work in SolidStart as well. 

But SolidStart also provides an enhanced [`<a>`][nativea] tag, the [`<A>`][a] component. It is a wrapper around the [`<a>`][nativea] tag and provides a few additional features. Once the app in mounted, when the user navigates to a new page,  the [`<A>`][a] will take over the navigation and will render the new page without a full page refresh. Something that's commonly known as client-side routing. It also knows what to do when the app is running in other modes.

### Using links

The best way to add a link to another page in your app is to the use enhanced anchor tag [`<A>`][a]. You can add the `href` prop to the [`<A>`][a] tag, and we will navigate to that route in SPA style. 

```tsx twoslash {6}
import { A } from 'solid-start';

export default function Index() {
  return (
    <div>
      <A href="/about">About</A>
    </div>
  );
}
```

You can specify class names to add to the [`<A>`][a] tag when the current location matches the `href` of the anchor using the `activeClass` prop. Use the `inactiveClass` prop to add a class name to the [`<a>`][nativea] tag if the current route does not match the `href` of the anchor.

```tsx twoslash {6-12,15,18} filenam="routes/users.tsx"
import { A } from "solid-start"

export default function UsersLayout() {
  return (
    <div>
      <A
        href="./projects"
        activeClass="active-link"
        inactiveClass="inactive-link"
      >
        Projects
      </A>

      // renders this when the user is on /users/1/projects
      <a href="/users/1/projects" class="active-link">Projects</a>

      // and this when the user is on /users/1/tasks
      <a href="/users/1/projects" class="inactive-link">Projects</a>
    </div>
  );
}

```

### When the user clicks a button

There are cases where the anchor is not right for your navigation needs. For example,

- You want to navigate after an async process completes
- You want to navigate after the user clicks a button, and we do some logic.

For these use cases you can use an imperative [`navigate`][usenavigate-navigate] function that you can by calling [`useNavigate()`][usenavigate].

### Redirecting

The primary way of redirecting from a route to another is to use the `<Navigate />` component in the JSX. For example, if you want to redirect to the home page, you can use the following code.

```tsx twoslash filename="routes/inactive.tsx" {4}
import { Navigate } from "solid-start";

export default function InactivePage() {
  return <Navigate href="/" />;
}
```

  - **Server**: When we get a request for this page, we will send a [`308 (Redirect)`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308) response with `Location` header set to the home page. The browser will then do its normal redirect routine. This also helps crawlers to understand that the page should be redirected.
  - **Client**: When you navigate to this page from another page in the site, we will immediately navigate to the home page.

There is another way for redirects to happen in SolidStart. Using your data functions and actions. 

When you throw/return a redirect `Response` from your data function, SolidStart will take the user to the specified location.

```tsx twoslash filename="routes/users.tsx" {6}
function isLoggedIn(req: Request): boolean {
  return true;
}
// ---cut---
import { redirect, createServerData$ } from "solid-start/server";

export default function User() {
  const data = createServerData$((_, { request }) => {
    if (!isLoggedIn(request)) {
      throw redirect("/login");
    }

    return { id: 1 }
  });

  return <div>User {data()?.id}</div>;
}
```

Similarly, if your actions dispatched using `createRouteAction`/`createServerAction$` throw/return a redirect `Response`, SolidStart will take the user to the specified location.

## Dynamic routes

Dynamic routes are routes that can match any value for one segment of the route. For example, `/users/1` and `/users/2` are both valid routes. If this is the case for any userId, you can't go around defining separate routes for each user. You need dynamic routes. In SolidStart, dynamic routes are defined using square brackets (`[]`). For example, `/users/[id]` is a dynamic route, where `id` is the dynamic segment.


```tsx {2}
|-- routes/
    |-- users/
        |-- [id].tsx
```

```tsx twoslash filename="routes/users/[id].tsx"
import { useParams } from "solid-start";

export default function UserPage() {
  const params = useParams();
  return <div>User {params.id}</div>;
}
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
import { useParams } from "solid-start";

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

```tsx twoslash filename="routes/users/index.tsx"
import { Outlet } from "solid-start";

export default function UsersLayout() {
  return (
    <div>
      <h1>Users</h1>
      <Outlet />
    </div>
  );
}
```

[navlink]: /navigation#navigation-links
[usenavigate]: /api/useNavigate
[usenavigate-navigate]: /api/useNavigate#navigate
[api-routes]: /core-concepts/api-routes
[components]: /advanced/components
[fileroutes]: /api/FileRoutes
[a]: /api/A
[nativea]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a
