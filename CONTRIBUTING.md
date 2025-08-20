# Contributing

- **Node.js**: Version 22 or higher
- Use a Node.js version manager compatible with `.node-version` ([asdf-vm](https://asdf-vm.com) is a great option for macOS/Linux users)
- Use pnpm package manager

## Setup

```bash
# Clone the SolidStart repository
git clone https://github.com/solidjs/solid-start.git
```

```bash
# Install pnpm as the package manager
npm install -g pnpm
```

```bash
# Install all monorepo dependencies
pnpm install
```

```bash
# Build dependencies
pnpm run build:all
```

## Testing Changes

1. Modify the codebase as needed.
2. Run an example project to verify your changes work as expected:

```bash
# Run an example (e.g. hackernews)
pnpm --filter example-hackernews run dev
```

3. Run tests

```bash
# Setup Playwright
pnpm run install:playwright
```

```bash
# Run all tests
pnpm run test:all
```

```bash
# Show test report
pnpm run show:test-report
```

## Monorepo Configuration

If you are using SolidStart within a monorepo that takes advantage of the `package.json` `"workspaces"` property (e.g. [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces)) with hoisted dependencies (the default for Yarn), you must include `@solidjs/start` within the optional `"nohoist"` (for Yarn v1) or configure hoisting limits (for Yarn v2 or higher) to ensure dependencies are correctly placed.

- _In the following, "workspace root" refers to the root of your repository, while "project root" refers to the root of a child package within your repository._

### Yarn v1 (nohoist)

For example, if specifying `"nohoist"` options from the workspace root (i.e., for all packages):

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

The reason why this is necessary is because `@solidjs/start` creates an `index.html` file within your project which expects to load a script located in `/node_modules/@solidjs/start/runtime/entry.jsx` (where `/` is the path of your project root). By default, if you hoist the `@solidjs/start` dependency into the workspace root, then that script will not be available within the package's `node_modules` folder.

### Yarn v2 or Higher

The `nohoist` option is no longer available in Yarn v2+. In this case, we can use the `installConfig` property in the `package.json` (either workspace package or a specific project package) to make sure our dependencies are not hoisted:

```jsonc
// in project root of a workspace child
{
  "installConfig": {
    "hoistingLimits": "dependencies"
  }
}
```
