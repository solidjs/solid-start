# SolidStart Agent Guidelines

## Build/Test Commands
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests  
- `pnpm test -- <pattern>` - Run specific test pattern
- `pnpm --filter tests unit` - Run unit tests with Vitest
- `pnpm --filter tests unit -- <file>` - Run single test file
- `pnpm --filter tests e2e:run` - Run Cypress E2E tests
- `pnpm --filter @solidjs/start typecheck` - Type check main package
- `pnpm -r typecheck` - Type check all packages
- `pnpm clean` - Clean all build artifacts

## CI/CD & Release Process
- Uses changesets for versioning - create `.changeset/<name>.md` files for releases
- All PRs must pass typecheck, unit tests, and E2E tests (Chromium + Firefox)
- Release workflow auto-publishes on main branch push with changesets
- Continuous releases use `pkg-pr-new` for preview packages on PRs

## Code Style & Architecture
- **TypeScript**: Required, use ESNext target, strict typing, jsxImportSource: "solid-js"
- **File Structure**: `/src/{client,server,shared,router,middleware}` - separate by runtime environment
- **Exports**: Use `// @refresh skip` at top of non-reactive files, group related exports
- **Imports**: Named imports, relative paths for local files, organize by: solid-js, external, internal
- **Components**: Function declarations for components, arrow functions for utilities
- **Error Handling**: Use ErrorBoundary patterns, proper TypeScript error types, console.error for logging
- **Formatting**: Prettier with 2-space tabs, no trailing commas, double quotes, 100 char width
- **Testing**: Vitest for unit tests, Cypress for E2E, use `describe.skip()` for problematic tests
- **Server Functions**: Export server functions properly, use getServerFunctionMeta() for metadata