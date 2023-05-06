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

# with npm
npm init solid@latest
npm install
npm run dev

# or with pnpm
pnpm create solid@latest
pnpm i
pnpm dev
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

### Credits

All credit for the work on Forms and Sessions goes to the @remix-run team, MIT License, Copyright 2021 Remix Software Inc.
