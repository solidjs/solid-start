<p>
  <img width="100%" src="https://assets.solidjs.com/banner?project=Start&type=core" alt="Solid Docs">
</p>

# SolidStart

This is the home of the Solid app framework. This is still a **work in progress**. Many features are missing or incomplete. Experimental status does not even mean beta status. Patch releases will break everything.

- File-system based routing
- Supports all rendering modes: Server-side rendering (SSR), Client-side rendering (CSR), Static Site Generation (SSG)
- Streaming
- Build optimizations with Code splitting, tree shaking and dead code elimination
- API Routes
- Built on Web standards: Fetch, Streams, WebCrypto
- Adapters for deployment to all popular platforms
- CSS Modules, SASS/SCSS Support
- Typescript-first

### Getting started

```bash
mkdir my-app
cd my-app
npm init solid@next
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
<summary>

### Changelog

</summary>

#### [0.1.0-alpha.??] - Moving towards beta

- `entry-server.tsx`: The prop received by `StartServer`, and given to you by `createHandler` is called `event` instead of `context`.

```diff
import { createHandler, renderAsync, StartServer } from "solid-start/entry-server";

- export default createHandler(renderAsync(context => <StartServer context={context} />));
+ export default createHandler(renderAsync(event => <StartServer event={event} />));

```

- `entry-client.tsx`: Earlier, you called `hydrate(document)` or `render(document.body)` here based on what kind of rendering mode you had selected and whether you had SSR turned on. We felt this was slightly annoying to change if you wanted to switch between the modes and error prone if you are not careful and end up passing `document` to `render` instead.

We still wanted to expose `entry-client.tsx` to the user so that they can take over and do their own thing here if they want. We made a helper function called `mount` that embeds the logic for deciding how to interact with the app we get from the server, be it `hydrate` or `render`.

If you were using SSR:

```diff
- import { hydrate } from "solid-js";
- import { StartClient } from "solid-start/entry-client";
+ import { mount, StartClient } from "solid-start/entry-client";

- hydrate(() => <StartClient />, document);
+ mount(() => <StartClient />, document);

```

If you were not using SSR and just rendering your app client-side:

```diff
- import { render } from "solid-js";
- import { StartClient } from "solid-start/entry-client";
+ import { mount, StartClient } from "solid-start/entry-client";

- render(() => <StartClient />, document.body);
+ mount(() => <StartClient />, document);

```

- `root.tsx`

  - Step 1: We changed how we declare our routes here a bit to make it more flexible. Earlier we gave you a `Routes` component from `solid-start/root` that was equivalent to rendering a `Routes` from `solid-app-router` (yeah we know its confusing, that's why we are changing it) and filling it with the routes from the file system. You didn't have an opportunity to add more `Route` components there for some routes you want to manually add. So now we make this a bit more transparent. We now export `FileRoutes` from `solid-start/root` that represents the route config based on the file-system. It is meant to be passed to `Routes` component from `solid-app-router` or wherever you want to use the file-system routes config.

```diff
// @refresh reload
import { Suspense } from "solid-js";
import { ErrorBoundary } from "solid-start/error-boundary";
- import { Meta, Link, Routes, Scripts } from "solid-start/root";
+ import { Meta, Link, FileRoutes, Scripts } from "solid-start/root";
+ import { Routes } from "solid-app-router";

export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Link />
      </head>
      <body>
        <Suspense>
          <ErrorBoundary>
            <a href="/">Index</a>
            <a href="/about">About</a>
-            <Routes />
+            <Routes>
+              <FileRoutes />
+            </Routes>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </body>
    </html>
  );
}
```

</details>
<details>
<summary>

#### Monorepo & `project.json` `"workspace"` support

</summary>

If you are using Solid Start within a monorepo that takes advantage of the `package.json` `"workspaces"` property (e.g. [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/)) with hoisted dependencies (the default for yarn), you must include `solid-start` within the optional `"nohoist"` workspaces property.

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

Regardless of where you specify the nohoist option, you also need to include `solid-start` as a devDependency in the child `package.json`.

The reason why this is necessary is because `solid-start` creates an `index.html` file within your project which expects to load a script located in `/node_modules/solid-start/runtime/entry.jsx` (where `/` is the path of your project root). By default, if you hoist the `solid-start` dependency into the workspace root then that script will not be available within the package's `node_modules` folder.

</details>
