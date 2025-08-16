# SolidStart Agent Guidelines

## Build/Test Commands
- `pnpm build` - Build all packages  
- `pnpm test` - Run all tests
- `pnpm test -- --grep "specific test"` - Run single test by pattern
- `pnpm --filter solid-start-tests unit` - Run unit tests  
- `pnpm --filter solid-start-tests e2e` - Run e2e tests
- `pnpm typecheck` - Type check (in packages/start)

## Code Style
- Use double quotes, 2-space indentation, semicolons, 100 char line width
- JSX: Use `class` not `className`, preserve JSX syntax
- Imports: Use `~/` for relative imports, import types with `type`
- Components: PascalCase default exports, no prop destructuring in params
- Files: Use `.tsx` for components, `.ts` for utilities
- Functions: Prefer function declarations over arrow functions for components
- Error handling: Use try/catch blocks, provide meaningful error messages

## packages/start/ Structure (Primary Focus)
- `src/client/` - Client-side code, hydration, mounting
- `src/server/` - Server-side rendering, StartServer component  
- `src/shared/` - Shared utilities, ErrorBoundary, dev overlay
- `src/router/` - File-based routing, lazy loading
- `src/middleware/` - Request/response middleware
- `src/runtime/` - Server function runtime, handlers
- `config/` - Vinxi configuration files

## packages/start/ Conventions
- Use `// @refresh skip` for non-refreshable components
- Import App with `#start/app` alias
- Prefer `getRequestEvent()` for server context access
- Use `import.meta.env` for environment variables
- Components export default functions with TypeScript types
- Server functions use `.tsx` extension even without JSX
- Use `isServer` from solid-js/web for SSR/client branching
- Error boundaries should handle both server (500) and client errors
- Use `ssr()` for server-only content like DOCTYPE
- Asset rendering uses `renderAsset()` helper function