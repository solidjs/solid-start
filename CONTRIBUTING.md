# Contributing

Thank you for your interest in contributing to **SolidStart**! We welcome contributions including bug fixes, feature enhancements, documentation improvements, and more.

## Prerequisites

- **Node.js**: Use the version specified in `.nvmrc`, to manage multiple versions across your system, we recommend a version manager such as [fnm](https://github.com/Schniz/fnm), or another of your preference.
- **pnpm**: Install globally via `npm install -g pnpm`. Or let **Corepack** handle it in the setup step below.
- **Git**: Ensure Git is installed for cloning and managing the repository

## Setup

1. Clone the repository

   ```bash
   git clone https://github.com/solidjs/solid-start.git
   cd solid-start
   ```

2. Enable the correct pnpm version specified in package.json

   ```bash
   corepack enable
   ```

3. Install dependencies

   ```bash
   pnpm install
   ```

4. Build all packages and the landing page
   ```bash
   pnpm run build:all
   ```

If you encounter issues (e.g. missing `node_modules`), clean the workspace

```bash
pnpm run clean:all
```

Then reinstall dependencies and rebuild.

## Monorepo Structure

SolidStart is a pnpm-based monorepo with nested workspaces. Key directories include

- **`packages/start`**: The core `@solidjs/start` package.
- **`packages/landing-page`**: The official landing page.
- **`examples/`**: Example projects for testing (a nested workspace; see details below).
- **`packages/tests`**: Unit and end-to-end (E2E) tests using Vitest and Cypress.

Use pnpm filters (e.g. `pnpm --filter @solidjs/start ...`) to target specific packages.  
The `examples/` directory is a separate workspace with its own `pnpm-workspace.yaml` and `pnpm-lock.yaml`.

## Developing and Testing Changes

1. Make your changes in the relevant package (e.g. `packages/start`)

2. Rebuild affected packages

   ```bash
   pnpm run packages:build
   ```

   For a full rebuild: `pnpm run build:all`

3. Test your changes

   - For examples
     ```bash
     cd examples
     pnpm install
     pnpm --filter example-hackernews run dev # Runs the HackerNews example
     ```
   - For the landing page (from the root directory)
     ```bash
     pnpm run lp:dev
     ```

4. Clean builds if needed
   ```bash
   pnpm run packages:clean # Cleans packages' node_modules and dist folders
   pnpm run lp:clean # Cleans the landing page
   pnpm run clean:root # Cleans root-level caches
   ```

## Running Tests

Tests are located in `packages/tests`, using Vitest for unit tests and Cypress for E2E tests.

1. Install the Cypress binary (required only once)

   ```bash
   pnpm --filter tests exec cypress install
   ```

2. For unit tests that check build artifacts, build the test app first

   ```bash
   pnpm --filter tests run build
   ```

3. Run unit tests

   ```bash
   pnpm --filter tests run unit
   ```

   - CI mode (run once): `pnpm --filter tests run unit:ci`
   - UI mode: `pnpm --filter tests run unit:ui`

4. Run E2E tests

   ```bash
   pnpm --filter tests run e2e:run
   ```

   - Interactive mode: `pnpm --filter tests run e2e:open`
   - With dev server: `pnpm --filter tests run e2e`

5. Clean test artifacts
   ```bash
   pnpm run clean:test
   ```

## Using SolidStart in Your Own Monorepo

When integrating `@solidjs/start` into your own monorepo (e.g. using Yarn workspaces), configure dependency hoisting to ensure proper resolution. This helps runtime components (e.g. `client/index.tsx`) resolve correctly in generated files like `index.html`.

### Yarn v2+

In the project root's `package.json`

```jsonc
{
  "installConfig": {
    "hoistingLimits": "dependencies"
  }
}
```

For pnpm monorepos, define workspaces in `pnpm-workspace.yaml`. If you encounter resolution issues (e.g. missing modules like `h3` from Vinxi), add `shamefully-hoist=true` to your `.npmrc` file. Test for duplicates and adjust configurations as necessary.
