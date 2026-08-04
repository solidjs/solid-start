# @solidjs/start

## 2.0.0

### Highlights

SolidStart v2 is now stable. This release replaces Vinxi with direct use of Vite’s Environment API, providing Solid v1 applications with a simpler Vite 8 and Rolldown-powered foundation, improved compatibility with the Vite ecosystem, and direct integration with deployment plugins.

SolidStart v2 requires Node.js 24 or newer and Vite 8. Most SolidStart v1 applications can upgrade by moving their framework configuration from `app.config.ts` to `vite.config.ts` and following the migration guide.

- [Read the full SolidStart v2 announcement](https://github.com/solidjs/solid-start/discussions/2281)
- [Follow the migration guide](https://docs.solidjs.com/solid-start/v2/migrating-from-v1)
- [View the complete changelog](https://github.com/solidjs/solid-start/blob/main/packages/start/CHANGELOG.md)

## 2.0.0-rc.10

### Minor Changes

- 3f2b7a7: The file filter logic used for CSS crawling in development can now be configured with the vite plugin option `css.filter` analog to `serverFunctions.filter`:

  ```ts
  solidStart({
    css: {
      filter: {
        // Exclude all node_modules except "my-dependency" with a flat node_modules layout
        exclude: "node_modules/!(my-dependency)/**/*",
      },
    },
  });
  ```

### Patch Changes

- 6581877: Fixed shared chunk css not being server rendered in production (Vite 8 regression).
- 37d4488: Migrate the built-in Vite configuration from the deprecated `rollupOptions` alias to `rolldownOptions`.
- 3f2b7a7: Fixed css from files with url sensitive characters such as `+` not being server-rendered.

## 2.0.0-rc.9

### Patch Changes

- 8eef552: Remove type-only import remnants from client server-function transforms so they do not retain server-only dependency chains.

## 2.0.0-rc.8

### Patch Changes

- 3573985: Await asynchronous `serverFunctions.onError` handlers before serializing server function errors.
  Preserve the original error if the handler throws or rejects.

## 2.0.0-rc.7

### Patch Changes

- 87d73e1: chore: bump seroval to v1.6.0

## 2.0.0-rc.6

### Minor Changes

- bac24b2: Add a `serverFunctions.onError` option naming a module that observes and replaces what a server function threw, before it is serialized into the response

### Patch Changes

- 27c2877: Remove leftover debug `console.log` calls from the server functions inspector, which logged on every server function request in dev.
- f15724b: Declare `@solidjs/router` as an optional peer dependency constrained to `>=0.16.0 <2.0.0-0`. Router v2 is expected to target Solid v2, so installing it alongside `@solidjs/start` v2 now surfaces a peer warning instead of silently producing an incompatible pairing. The peer is marked optional, so apps that do not use the router are unaffected.
- 5c8612f: Apply cookies set on a returned or thrown response during single flight mutations. `redirect(to, { headers: { "Set-Cookie": ... } })` previously only reached the browser: the single flight re-render of the redirect target still ran with the old request cookies, so queries reading that cookie saw stale values. Those cookies are now merged into the request the re-render sees, matching what a browser round trip would have sent.
- 83122ed: Reject server function calls when the response is a 5xx without an X-Error header, instead of resolving with the parsed error body

## 2.0.0-rc.5

### Minor Changes

- 4c803e5: Add `serialization.plugins` to configure custom Seroval plugins for server functions.

  Values Seroval has no built-in support for (Mongo's `ObjectId`, Prisma's `Decimal`, `Temporal`, and other custom classes) previously threw when returned from or passed to a server function. Point the new option at a module whose default export is an array of plugins:

  ```ts
  // vite.config.ts
  solidStart({
    serialization: {
      plugins: "src/seroval-plugins.ts",
    },
  });
  ```

  ```ts
  // src/seroval-plugins.ts
  import { createPlugin } from "@solidjs/start/serialization";
  ```

  The module is bundled into both the client and the server so both ends of a server function agree on the format, so it must not import server-only code. SolidStart's built-in plugins keep precedence. Only server-function and action payloads are affected; the SSR hydration payload is serialized by `solid-js/web`.

  Also adds a `@solidjs/start/serialization` entrypoint re-exporting Seroval's `createPlugin`, `OpaqueReference`, and plugin types, so plugin authors stay on the same Seroval version SolidStart serializes with.

### Patch Changes

- e117d91: Route module ids now end in the source extension, so ecosystem plugins apply inside `src/routes`.

  Route files are imported through an id carrying the picked exports in the query (`routes/api.ts?pick=GET`), which left the id ending in the export name. Plugins whose filter is anchored on the file extension (`/\.[cm]?[jt]sx?$/`, the default for `unplugin-auto-import`, `unplugin-macros` and others) silently skipped every route file. The id now ends with a `lang.<ext>` marker, the same convention Vue SFCs use for `?vue&type=script&lang.ts`. Chunk filenames are unchanged.

- d8f1ea8: Apply the configured `nonce` to the two script tags that were still missing it, so a strict `script-src` CSP no longer needs `unsafe-inline`:
  - The client-side redirect that streaming mode emits after the shell has already flushed (`<script>window.location=...</script>`) now carries the nonce.
  - The SPA entry script tag now carries the nonce, matching the SSR entry script.

- 27fca88: Fix actions returning `json()` or `reload()` leaving no-JS form submissions stranded on the `/_server` endpoint. These responses carry a value rather than a destination, so the redirect issued for progressive-enhancement submissions had no `Location` header. It now falls back to the submitting page, and the response value is unwrapped into the flash cookie so `useSubmission().result` matches the JS path.
- 75debc3: Scope the built-in `~` alias to the app package, so files in other workspace packages can map `~` to their own root through an importer-aware plugin such as `vite-tsconfig-paths`. In stylesheets and asset URLs (CSS `@import`, `url()`, `new URL(..., import.meta.url)`) `~` still always means the app root, since Vite resolves those without running plugins.

## 2.0.0-rc.4

### Patch Changes

- b6dfaac: Updated dependencies, including `cookie-es` to 3, `shiki` to 4, `srvx` to 0.12.4, `oxc-parser` to 0.141 and `seroval` to 1.5.6. `parseSetCookie` now returns `undefined` for cookies with a forbidden name or an empty name and value, and those cookies are no longer forwarded to nested server function requests.
- 02cd41e: Stop the dev toolbar from reporting benign `ResizeObserver loop` notifications as application errors. Browsers dispatch these as window `error` events carrying no error object, so the toolbar was capturing the raw `ErrorEvent` and force-opening the error panel over the app on every resize.
- d3c2af2: Don't send server error stack traces to the client in production builds. When a server function throws, the error is serialized and rethrown on the client, and seroval included `Error.prototype.stack` by default, leaking server file paths and internal function names. Stacks are still serialized in development.

## 2.0.0-rc.3

### Patch Changes

- d9018d6: fix(types): add missing properties to `SolidStartOptions` and expose them via Vite plugin configuration
- e26cef0: Fix TS2883/TS2742 when emitting declarations for `entry-server.tsx`. `createHandler` now returns `StartHandler`, a type owned by `@solidjs/start`, instead of h3's `H3`, so the inferred type of `export default createHandler(...)` no longer has to be named through a nested `node_modules/@solidjs/start/node_modules/h3` path.
- 7c8dbe6: keep TypeScript namespace members in route files during production builds
- b3c7aaf: Update `h3` to `2.0.1-rc.26`.
- b3c7aaf: Fixed event response status and headers set during server-side rendering with deferred async resources, not being applied on the outgoing response.

## 2.0.0-rc.2

### Minor Changes

- eeff49a: add new dev toolbar

### Patch Changes

- bd8cb01: Update srvx to version 0.12.0.
- 4e98ac0: Restore the optional `routerLoad` third argument to `createHandler`, which primes custom routers (e.g. TanStack Router) on the server before SSR rendering. It was accidentally dropped in the v2 rewrite.

## 2.0.0-rc.1

### Minor Changes

- 02e561e: Expose experimental `decorateHandler` and `decorateMiddleware` helpers from
  `@solidjs/start/server` for providing Solid's request context to custom h3 handlers and
  middleware.

### Patch Changes

- f66b5a9: fix: keep non-picked route exports that picked exports reference instead of deleting their bindings, so API handlers can call helpers exported from the same file (#2100); also fixes picked exports declared via `export { ... }` specifiers being dropped (#1659)
- 1763296: fix: run `onBeforeResponse` middleware in declared order (#2131)

  Applications that reversed their `onBeforeResponse` arrays as a workaround should restore the intended declaration order.

- cd98e7d: Fix API route matching when `server.baseURL` is configured.

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
