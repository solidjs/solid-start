# @solidjs/start

## 2.0.0-alpha.3

### Minor Changes

- 798b285: Updated dependencies.
- f6f0452: seroval json mode
- d4be1b6: Add new directives plugin with shorter function IDs and inner declaration support
- b9c4ade: feat: add `env:*` runtime environment variables support

### Patch Changes

- ff9607c: import DevEnvironment and Rollup as type from vite
- 2885905: fix: clone request headers in single-flight to avoid mutating immutable headers
- abe3979: reload ssr server when new route files are created in dev
- 7c288f6: Sanitize Location header value in streaming redirect script
- 6c83886: update seroval to 1.5.4
- 9d5d783: Add support for Vite 8 asset manifest loading

## 2.0.0-alpha.2

### Minor Changes

- 10bf932: Fix path resolution on Windows
- 40d5a27: fix onBeforeResponse
- 9201e71: fix text/html missing when ssr is false
- a9cd2cc: add `vite preview` support

### Patch Changes

- 7077a49: Fixed CSS from shared chunks not being collected via the chunk name.
- a620eeb: Fixed virtual module CSS not being collected in vite dev.

## 2.0.0-alpha.1

### Patch Changes

- 8256190: Rework `@solidjs/start/env`
- 6cbba24: Fix multiple Set-Cookie headers being lost on redirect responses
- d4cc548: ## Bump Seroval

  - version `1.4.1`

- dd40610: Handle base url in api routes
- 0c8a5e2: export server types from /server
