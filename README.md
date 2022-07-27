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

- `entry-server.tsx`: The prop received by `StartServer` is called `event` representing the FetchEvent received by the server. eg.

```diff
import { createHandler, renderAsync, StartServer } from "solid-start/entry-server";

- export default createHandler(renderAsync(context => <StartServer context={context} />));
+ export default createHandler(renderAsync(event => <StartServer event={event} />));

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
