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
- **`apps/landing-page`**: The official landing page.
- **`apps/tests`**: Unit and end-to-end (E2E) tests using Vitest and Cypress.
- **`apps/fixtures`**: Fixture projects for testing.

Use pnpm filters (e.g. `pnpm --filter @solidjs/start ...`) to target specific packages.

## Developing and Testing Changes

1. Make your changes in the relevant package (e.g. `packages/start`)

2. Rebuild affected packages

   ```bash
   pnpm run packages:build
   ```

   For a full rebuild: `pnpm run build:all`

3. Test your changes

   - For fixtures, pick the name of the fixture and run the `dev` with workspace filtering.
     ```bash
     pnpm --filter fixture-basic dev
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

End-to-end tests are located in `apps/tests` projects. For manual testing and development there's the `apps/fixtures` apps, and finally, integration and unit tests live inside their respective packages.

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
   pnpm --filter tests run tests:run
   ```

   - Interactive mode: `pnpm --filter tests run tests:open`
   - With dev server: `pnpm --filter tests run tests`

5. Clean test artifacts
   ```bash
   pnpm run clean:test
   ```
