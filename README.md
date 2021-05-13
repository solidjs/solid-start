# Solid Start

This is the home of the new official starter for Solid. This is still a work in progress. Many features are missing or incomplete. Experimental status does not even mean beta status. Patch releases will break everything.

Heavily borrowed from SvelteKit. Much appreciate the work being done there.

```bash
mkdir my-app
cd my-app
npm init solid@next
npm install
npm run dev
```

## Monorepo & `project.json` `"workspace"` support

If you are using Solid Start within a monorepo that takes advantage of the `package.json` `"workspaces"` property (e.g. [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/)) with hoisted dependencies (the default for yarn), you must include `solid-start` within the optional `"nohoist"` workspaces property.

- _In the following, "workspace root" refers to the root of your repository while "project root" refers to the root of a child package within your repository_

For example, if specifying `"nohoist"` options from the workspace root (i.e. for all packages):

```json
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

```json
// in project root of a workspace child
{
  "workspaces": {
    "nohoist": ["solid-start"]
  }
}
```

Regardless of where you specify the nohoist option, you also need to include `solid-start` as a devDependency in the child `package.json`.

The reason why this is necessary is because `solid-start` creates an `index.html` file within your project which expects to load a script located in `/node_modules/solid-start/runtime/entry.jsx` (where `/` is the path of your project root). By default, if you hoist the `solid-start` dependency into the workspace root then that script will not be available within the package's `node_modules` folder.
