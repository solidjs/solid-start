<div align="center">

[![Banner](https://assets.solidjs.com/banner?project=Start&type=core)](https://github.com/solidjs)

[![Version](https://img.shields.io/npm/v/@solidjs/start.svg?style=for-the-badge&color=blue&logo=npm)](https://npmjs.com/package/@solidjs/start)
[![Downloads](https://img.shields.io/npm/dm/@solidjs/start.svg?style=for-the-badge&color=green&logo=npm)](https://npmjs.com/package/@solidjs/start)
[![Stars](https://img.shields.io/github/stars/solidjs/solid-start?style=for-the-badge&color=yellow&logo=github)](https://github.com/solidjs/solid-start)
[![Discord](https://img.shields.io/discord/722131463138705510?label=join&style=for-the-badge&color=5865F2&logo=discord&logoColor=white)](https://discord.com/invite/solidjs)
[![Reddit](https://img.shields.io/reddit/subreddit-subscribers/solidjs?label=join&style=for-the-badge&color=FF4500&logo=reddit&logoColor=white)](https://reddit.com/r/solidjs)

</div>

- For building apps with SolidStart, check the [package README](/packages/start/README.md) and our [official docs](https://docs.solidjs.com/solid-start)
- For contributing to codebase, check [CONTRIBUTING.md](/CONTRIBUTING.md)
- For creating a new template, please head over to [solidjs/templates](https://github.com/solidjs/templates)

## Prerequisites

- **Node.js**: Use the version specified in `.nvmrc`. To manage multiple versions across your system, we recommend a version manager such as [fnm](https://github.com/Schniz/fnm), or another of your preference.
- **pnpm**: Install globally via `npm install -g pnpm`. Or let **Corepack** handle it in the setup step below.
- **Git**: Ensure Git is installed for cloning and managing the repository.

## Monorepo Structure

SolidStart is a pnpm-based monorepo with nested workspaces. Key directories include:

- **`packages/start`**: The core `@solidjs/start` package.
- **`apps/landing-page`**: The official landing page.
- **`apps/tests`**: Unit and end-to-end (E2E) tests using Vitest and Cypress.
- **`apps/fixtures`**: Fixture projects for testing.

Use pnpm filters (e.g. `pnpm --filter @solidjs/start ...`) to target specific packages.

## Local Setup

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
   pnpm dedupe
   ```

   (`pnpm dedupe` will install dependencies _and_ clean the lockfile from duplicates, useful for preventing conflicts).

4. Build all packages and the landing page
   ```bash
   pnpm run build:all
   ```

If you encounter issues (e.g. missing `node_modules`), clean the workspace

```bash
pnpm run clean:all
```

Then reinstall dependencies and rebuild.

## Running Tests

End-to-end tests are located in `apps/tests` projects. For manual testing and development use the `apps/fixtures` apps, and finally, integration and unit tests live inside their respective packages.

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

## Development

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

---

If you have read all the way here, you're already a champ! 🏆
Thank you.
