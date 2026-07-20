# @solidjs/start

## 2.0.0-beta.10

### Patch Changes

- 8af6304: Support for Vite 8.1 Experimental Bundled Dev Mode
- 9d91484: fix: don't crash when a server function throws an error whose message contains non-latin1 characters.
- 068b64c: Return a cancellation-safe web `ReadableStream` for streaming SSR in development. Returning Solid's
  raw stream only rendered on Node; Bun and Deno coerced it to `[object Object]`.

## 2.0.0-beta.9

### Minor Changes

- f3e84ec: Add support for `server-only` and `client-only` modules

### Patch Changes

- a8a2328: fix: mark `@solidjs/start/http` and `@solidjs/start/middleware` as `server-only` so importing them from client-reachable code fails loudly at dev/build time, instead of silently shipping them to the browser where they crashed hydration and broke unrelated actions/forms with no diagnostic (#2068)

## 2.0.0-beta.8

### Patch Changes

- ecc02be: fix: resolve server functions in dev when their route was reached through client-side navigation before its module was evaluated on the server
- 85b24b2: Use per-environment Vite plugin hook APIs for forward compatibility with Vite 9.

## 2.0.0-beta.7

### Patch Changes

- d2f0621: Support JavaScript projects whose app and client/server entries use `.jsx`.

## 2.0.0-beta.6

### Patch Changes

- 25769f2: Fix Vite preview for non-HTML responses and projects whose server build uses an `.mjs`
  entry.

## 2.0.0-beta.5

### Patch Changes

- eb73dd5: Use `oxc-parser` to analyze filesystem route exports.

## 2.0.0-beta.4

### Patch Changes

- 21fdb2c: Update `h3` to `2.0.1-rc.25`.

## 2.0.0-beta.3

### Patch Changes

- 12dc2d3: Bundle `h3` and `cookie-es` into server builds to avoid resolving incompatible hoisted versions

## 2.0.0-beta.2

### Patch Changes

- 3e961e0: Require Vite 8
- 11907a2: Fix published package missing `dist/`: pnpm 11 respects `.gitignore` when packing a package without a `files` field, so `2.0.0-beta.1` was published without its build output. Add an explicit `files` field.

## 2.0.0-beta.1

### Patch Changes

- ee1193a: Update srvx to maintain response compatibility with Nitro v3.
- e263338: Fix `ERR_UNSUPPORTED_ESM_URL_SCHEME` when running `vite preview` on Windows

## 2.0.0-beta.0

### Minor Changes

- 0a9fdc3: fix cloudflare

### Patch Changes

- 0c95804: Fix URL to path conversion in manifest resolver
- 6011e5a: Fixed changes in route files resulting in a reload instead of hot module replace. Reloads now only are triggered when adding or removing routes.
- 8fb81e6: Fixed niche edge cases in the server functions dead code removal (DCE) logic:
  - Server functions only referenced in event handlers (e.g. `onClick`) now aren't considered unused and work properly.
  - Unused variables in server functions no longer lead to compilation errors.
- 8d12d6a: Fixed tailwind class changes not getting applied via HMR in filesystem routes.
- ec1b82b: Included Vite 8 in the peer dependency range.

## 2.0.0-alpha.3

### Minor Changes

- 798b285: Updated dependencies.
- f6f0452: seroval json mode
- d4be1b6: Add new directives plugin with shorter function IDs and inner declaration support
- b9c4ade: feat: add `env:*` runtime environment variables support

### Patch Changes

- ff9607c: import DevEnvironment and Rollup as type from vite
- 6da636b: The server function directives runtime is now internally accessed via package.json exports instead of relative paths, fixing inconsistencies in the file resolution. Also the server functions file inclusion/exclusion patterns can now be configured in the start plugin options via `serverFunctions`.
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
