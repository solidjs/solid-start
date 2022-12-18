<p>
  <img width="100%" src="https://assets.solidjs.com/banner?project=Start&type=core" alt="Solid Docs">
</p>

# SolidStart

This is the home of the Solid app framework. This is still a **work in progress**. Many features are missing or incomplete. Experimental status does not even mean beta status. Patch releases will break everything.

- File-system based routing
- Supports all rendering modes:
  - Server-side rendering (SSR)
  - Streaming SSR
  - Client-side rendering (CSR)
  - Static Site Generation (SSG)
- Streaming
- Build optimizations with Code splitting, tree shaking and dead code elimination
- API Routes
- Built on Web standards like Fetch, Streams, and WebCrypto
- Adapters for deployment to all popular platforms
- CSS Modules, SASS/SCSS Support
- TypeScript-first

### Getting started

```bash
mkdir my-app
cd my-app
npm init solid@latest
npm install
npm run dev
```

### Development

The monorepo uses `pnpm` as the package manager. To install `pnpm`, run the following command in your terminal.

```bash
npm install -g pnpm
```

Run `pnpm install` to install all the dependencies for the packages and examples in your monorepo.

<details>
<summary><h4>Monorepo & <code>project.json</code> <code>"workspace"</code> support</h4></summary>

If you are using Solid Start within a monorepo that takes advantage of the `package.json` `"workspaces"` property (e.g. [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/)) with hoisted dependencies (the default for yarn), you must include `solid-start` within the optional `"nohoist"` (for yarn v2 or higher, see further down for instructions) workspaces property.

- _In the following, "workspace root" refers to the root of your repository while "project root" refers to the root of a child package within your repository_

For example, if specifying `"nohoist"` options from the workspace root (i.e. for all packages):

```jsonc
// in workspace root
{
  "workspaces": {
    "packages": [
      /* ... */
    ],
    "nohoist": ["**/solid-start"]
  }
}
```

If specifying `"nohoist"` options for a specific package using `solid-start`:

```jsonc
// in project root of a workspace child
{
  "workspaces": {
    "nohoist": ["solid-start"]
  }
}
```

Regardless of where you specify the `nohoist` option, you also need to include `solid-start` as a `devDependency` in the child `package.json`.

The reason why this is necessary is because `solid-start` creates an `index.html` file within your project which expects to load a script located in `/node_modules/solid-start/runtime/entry.jsx` (where `/` is the path of your project root). By default, if you hoist the `solid-start` dependency into the workspace root then that script will not be available within the package's `node_modules` folder.

**Yarn v2 or higher**

The `nohoist` option is no longer available in Yarn v2+. In this case, we can use the `installConfig` property in the `package.json` (either workspace package or a specific project package) to make sure our deps are not hoisted.

```jsonc
// in project root of a workspace child
{
  "installConfig": {
    "hoistingLimits": "dependencies"
  }
}
```

</details>

## Changelog

### [0.1.6]

Renamed API Routes exports from lower case to upper case method names to match closely how people see those functions in the spec and in usage.

```diff
- export function get() {
+ export function GET() {
  return new Response();
}

- export function post() {
+ export function POST() {

  return new Response();
}

- export function patch() {
+ export function PATCH() {
  return new Response();
}

- export function del() {
+ export function DELETE() {
  return new Response();
}
```

### [0.1.0-alpha.104]

Changed grouped routes from `__name` syntax to `(name)`.

### [0.1.0-alpha.103]

Changed special compiled functions like `server`, `createServerData`, `createServerAction$`, `createServerMultiAction$`. to have a postfix `$` to indicate their special compiled (hoisted behavior).

Also moved the optional first argument of `createServerData$` under `key` option. While this hides a very important option it makes the signatures more similar, so it is clear it is the main (first) function that is running on the server.

```js
const data = createServerData$(
  async pathname => {
    let mod = mods[`./docs${pathname}.mdx`] ?? mods[`./docs${pathname}.md`];
    return mod.getHeadings().filter(h => h.depth > 1 && h.depth <= 3);
  },
  {
    key: () => path.pathname
  }
);
```

### [0.1.0-alpha.??] - Moving towards beta

<details>
<summary><h3><mono>vite.config.ts</mono></h3></summary>

```diff
- import solid from 'solid-start';
+ import solid from 'solid-start/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [solid()]
})
```

#### Why?

We wanted to use the main entry point of `solid-start` for use within the app where you are spending most of your time. And for the `vite` config, we use the `solid-start/vite` entrypoint.
</details>

<details>
<summary><h3><mono>entry-server.tsx</mono></h3></summary>

```diff
import { createHandler, renderAsync, StartServer } from "solid-start/entry-server";

- export default createHandler(renderAsync(context => <StartServer context={context} />));
+ export default createHandler(renderAsync(event => <StartServer event={event} />));
```

#### Why?

The prop received by `StartServer`, and given to you by `createHandler` is called `event` instead of `context`. It represents a `PageEvent` which is a `FetchEvent` that the server decided should be rendered by our components as a `Page`. We adopted the `event` terminology to represent the input that our server handlers received.

For example, the input to our top-level server handler is a `FetchEvent`. It can then be routed to a server function and be passed as a `ServerFunctionEvent` or to an API Endpoint as an `ApiEvent`. This terminology is adopted from the ServiceWorker API and Cloudflare Workers API.

</details>

<details>
<summary><h3><mono>entry-client.tsx</mono></h3></summary>

If you were using SSR:

```diff
- import { hydrate } from "solid-js";
- import { StartClient } from "solid-start/entry-client";
+ import { mount, StartClient } from "solid-start/entry-client";

- hydrate(() => <StartClient />, document);
+ mount(() => <StartClient />, document);
```

If you were not using SSR and rendering your app client-side:

```diff
- import { render } from "solid-js";
- import { StartClient } from "solid-start/entry-client";
+ import { mount, StartClient } from "solid-start/entry-client";

- render(() => <StartClient />, document.body);
+ mount(() => <StartClient />, document);
```

#### Why?

Earlier, you called `hydrate(document)` or `render(document.body)` here based on what kind of rendering mode you had selected and whether you had SSR turned on. We felt this was slightly annoying to change if you wanted to switch between the modes and error prone if you are not careful and end up passing `document` to `render` instead.

We still wanted to expose `entry-client.tsx` to the user so that they can take over and do their own thing here if they want. We made a helper function called `mount` that embeds the logic for deciding how to interact with the app we get from the server, be it `hydrate` or `render`.

</details>

<details>
<summary><h3><mono>root.tsx</mono></h3></summary>

```diff
// @refresh reload
import { Suspense } from "solid-js";
- import { Meta, Link, Routes, Scripts } from "solid-start/root";
+ import { FileRoutes, Scripts, Html, Head, Body, Routes, Meta, ErrorBoundary, A } from "solid-start";

export default function Root() {
  return (
-    <html lang="en">
+    <Html lang="en">
-      <head>
+      <Head>

-        <meta charset="utf-8" />
+        <Meta charset="utf-8" />
-        <meta name="viewport" content="width=device-width, initial-scale=1" />
+        <Meta name="viewport" content="width=device-width, initial-scale=1" />

-        <Meta /> // already exists inside `Head`
-        <Links /> // already exists inside `Head`

-      </head>
+      </Head>
-      <body>
+      <Body>
         <Suspense>
           <ErrorBoundary>
             <A href="/">Index</A>
             <A href="/about">About</A>
-            <Routes />
+            <Routes>
+              <FileRoutes />
+            </Routes>
           </ErrorBoundary>
         </Suspense>
         <Scripts />
-     </body>
+     </Body>
-   </html>
+   </Html>
  );
}
```

#### Why?

We changed how we declare our routes to make it more flexible. Earlier we gave you a `Routes` component from `solid-start` that was equivalent to rendering a `Routes` from `@solidjs/router` (yeah we know its confusing, that's why we are changing it) and filling it with the routes from the file system. The opt-in to the file-system routing was all-in or nothing.

You didn't have an opportunity to add more `Route`s. We now export `FileRoutes` from `solid-start` that represents the route config based on the file-system. It is meant to be passed to the `Routes` component from `solid-start` or wherever you want to use the file-system routes config.

- You can use it together with other `Route` components.

```tsx
<Routes>
  <FileRoutes />
  <Route path="/somewhere" component={SomeComponent} />
</Routes>
```

- Also for quickly starting an app without creating a bunch of files, you can define your routes in a single file. We generally don't recommend this since it's a good idea to code split your app along your routes, but its a neat trick.

```tsx
<Routes>
  <Route path="/somewhere" component={SomeComponent} />
</Routes>
```

For consistency between the SSR and client-side rendering modes, we needed to take more control of `root.tsx` specifically, we couldn't just take `<html></html>` and `<head></head>` tags and allow them to be part of the component tree since we can't client-side render the whole document.

We only really get to take over `document.body`. We needed to ship with special `Html`, `Head`, and `Body` components that you use in `root.tsx` instead of the lower-case counterparts. These document flow components know what to do whether you are in SSR mode on or off.

- We can avoid you having to include `Meta` and `Links` from `solid-start/root` in your `head` since we do it by default.
- We will always use the title-case variants of the tags used in `head` (eg. `Link` > `link`, `Style` > `style`, `Meta` > `meta`) for consistency throughout the app.
- `solid-meta` is renamed to `@solidjs/meta`.
- `solid-app-router` is renamed to `@solidjs/router`.
- `solid-start` exports all the components meant to be used in your app and these components work on the client and server. Sometimes they are the same on both, and other times they coordinate between the two.

Now, our `root.tsx` even more closely replicates how you would be writing your `index.html`. And this was intentionally done so that we could enable an SPA mode for you that used the same code as the SSR mode without changing anything.

How do we do this? At build time for SPA mode, we quickly run the vite server and make a request for your app's index. We tell our `Body` component not to render anything.

So, the `index.html` we get is the one you would have written. We then use that `index.html` as your entrypoint. You can still write your own `index.html` if you don't want to use this functionality.

</details>

<details>
<summary><h3>createServerResource -> createServerData$</h3></summary>

Renamed `createServerResource` to `createServerData$`, and `createRouteResource` to `createRouteData`.

```diff
export function routeData() {
-  return createServerResource(async (_, { request }) => {
+  return createServerData$(async (_, { request }) => {
    const user = await getUser(request);

    if (!user) {
      throw redirect("/login");
    }

    return user;
  });
}
```

#### Why?

We renamed `createServerResource` to `createServerData$` because we were not using the `createResource` signature. That was confusing so we needed to indicate the function was compiled. We just return one single signal from `createServerData$` instead of a tuple like `createResource` does. And we have moved the source into the options as `key`.

</details>

<details>
<summary><h3>createServerAction$, createServerMultiAction$</h3></summary>

```diff
- const logoutAction = createServerAction(() => logout(server.request));
+ const [logginOut, logOut] = createServerAction$((_, { request }) => logout(request));
```

#### Why?

We pass in a `ServerFunctionEvent` which has a `request` field as the second argument to server actions. You can use this to access to the HTTP Request sent for your action and get the headers from it for things like auth.

We now return a tuple where the first argument is the current submission, and the second is the submit function it also has a progressive enhanceable form attached to it `logout.Form`.

</details>

<details>
<summary><h3>🆕 HttpStatusCode, HttpHeader</h3></summary>

```tsx
export default function NotFound() {
  return (
    <div>
      <HttpStatusCode code={404} />
      <HttpHeader name="my-header" value="header-value" />
    </div>
  );
}
```

</details>

### Credits

All credit for the work on Forms and Sessions goes to the @remix-run team, MIT License, Copyright 2021 Remix Software Inc.
