<p>
  <img width="100%" src="https://assets.solidjs.com/banner?project=Start&type=core" alt="Solid Docs">
</p>

# SolidStart

This is the home of the SolidStart, the Solid app framework.

## Features

- File-system based routing
- Supports all rendering modes:
  - Server-side rendering (SSR)
  - Streaming SSR
  - Client-side rendering (CSR)
  - Static site generation (SSG)
- Streaming
- Build optimizations with code splitting, tree shaking and dead code elimination
- API Routes
- Built on Web standards like Fetch, Streams, and WebCrypto
- Adapters for deployment to all popular platforms
- CSS Modules, SASS/SCSS Support
- TypeScript-first

### Getting started

Create a SolidStart application and run a development server using your preferred package manager:

```bash
mkdir my-app
cd my-app

# with npm
npm init solid@latest
npm install
npm run dev

# or with pnpm
pnpm create solid@latest
pnpm install
pnpm dev

# or with Bun
bun create solid@latest
bun install
bun dev
```

### Development

You should use a Node.js version manager [compatible with `.node-version`](https://stackoverflow.com/a/62978089/565877) ([asdf-vm](https://asdf-vm.com/) is a great option macOS/Linux users)

The monorepo uses `pnpm` as the package manager. To install `pnpm`, run the following command in your terminal.

```bash
npm install -g pnpm
```

Run `pnpm install` to install all the dependencies for the packages and examples in your monorepo.

Run `pnpm build` to build SolidStart project

<details>
<summary><h4>Monorepo & <code>project.json</code> <code>"workspace"</code> support</h4></summary>

If you are using SolidStart within a monorepo that takes advantage of the `package.json` `"workspaces"` property (e.g. [Yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/)) with hoisted dependencies (the default for Yarn), you must include `#solidjs/start` within the optional `"nohoist"` (for Yarn v2 or higher, see further down for instructions) workspaces property.

- _In the following, "workspace root" refers to the root of your repository while "project root" refers to the root of a child package within your repository._

For example, if specifying `"nohoist"` options from the workspace root (i.e. for all packages):

```jsonc
// in workspace root
{
  "workspaces": {
    "packages": [
      /* ... */
    ],
    "nohoist": ["**/@solidjs/start"]
  }
}
```

If specifying `"nohoist"` options for a specific package using `@solidjs/start`:

```jsonc
// in project root of a workspace child
{
  "workspaces": {
    "nohoist": ["@solidjs/start"]
  }
}
```

Regardless of where you specify the `nohoist` option, you also need to include `@solidjs/start` as a `devDependency` in the child `package.json`.

The reason why this is necessary is because `@solidjs/start` creates an `index.html` file within your project which expects to load a script located in `/node_modules/@solidjs/start/runtime/entry.jsx` (where `/` is the path of your project root). By default, if you hoist the `@solidjs/start` dependency into the workspace root then that script will not be available within the package's `node_modules` folder.

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
