# @solidjs/start

## 1.1.3

### Patch Changes

- ffd7cba: fix nested route with escaping resolved incorrectly (#1829).
  before `/routes/nested/(ignored)route.tsx` resolved to `/nestedroute`,
  and now it resolves to `/nested/route`.

## 1.1.2

### Patch Changes

- 0c9bc47: Fix issue with anonymous default exports
- 26e97be: Fix ssr for tanstack router

## 1.1.1

### Patch Changes

- efd762e: Bump tanstack server functions plugin
  This fixes `export const` in top-level `"use server"` files.
  The bundler warning for top-level `"use server"` is still there, but still code-removal works.

## 1.1.0

### Minor Changes

- 4ec5d9b: - Added "OPTIONS" to the HTTP_METHODS array in packages/start/config/fs-router.js.
  I made this change so developers can handle preflight OPTIONS requests when using SolidStart as a public facing REST API.
  Existing users will not have to change their code. This change only adds an additional feature.
- b434665: Vite 6 support
- 600c115: move the RequestEventLocals definition into the App namespace for easier end user retyping

### Patch Changes

- 00c6d33: update vinxi to 0.5.3
- df32b0d: Await internal `sendWebResponse` calls for middlewares that return responses.
- cda037b: Return `404` when server-function is not found
- a97093f: Move `getServerFunctionMeta` from `@solidjs/start/server` to `@solidjs/start` to fix circular import issues.

  The old export at `@solidjs/start/server` still exists, but is **deprecated** and will be removed in a future release.

- 5a166a4: Adopt tanstack server functions plugin

## 1.0.11

### Patch Changes

- 8e0c56c: forward set cookies through single-flight
- 9536d74: update vite-plugin-solid of start
- fa1128a: fix: handle request body streaming with latest netlify preset

## 1.0.10

### Patch Changes

- ec69889: fix #1649 append rather than override headers with flash message
- aa30192: forward all request headers through single flight
- 545a8ce: fix(start): enable HEAD requests to API HEAD/GET routes
- 708a7a1: forward request cookies on single flight mutations
- 715d563: fix #1645 flash encoding, and improve error handling

## 1.0.9

### Patch Changes

- 00a4908: Show proper dev overlay for ErrorEvent with no error property.
- 45171b2: chore: Replace `fast-glob` and `glob` with `tinyglobby`
- 5ef4f75: lazy load dev overlay
- bd8d7f5: fix passing empty revalidation header from actions

## 1.0.8

### Patch Changes

- 292f1cd: fix #1638 - devOverlay causing hydration mismatch

## 1.0.7

### Patch Changes

- 592fef1: Removes unused `vite-plugin-inspect` dependency.
- 65c8ac0: Fixed fetchEvent flakyness by storing the event in h3 context.
- 894594c: fix dev overlay being pulled in even when not used
- 7ae221b: encode api url components
- d719c6c: Update env.d.ts

## 1.0.6

### Patch Changes

- d86ab61: drastically improve asset resolution performance

## 1.0.5

### Patch Changes

- c4054c0: fix route hmr: fix #1286, fix #1461, fix #1473

## 1.0.4

### Patch Changes

- 5997509: Fixed a regression that resulted in an `Response body object should not be disturbed or locked` error during form body parsing.

## 1.0.3

### Patch Changes

- 1ec5e29: send URLSearchParams in server functions as urlencoded
- e53f086: update deps
- ac2d983: Safeguard of H3Event body stream locking in edge runtime
- c966159: fix server function proxy passthrough

## 1.0.2

### Patch Changes

- 9da8b18: fix #1547 add noscript tags to asset rendering
- d932ebd: Omit some keys from Vite server config
- b02151f: Add new response type in middleware function
- ae6ca2e: fix #1514 error header sanitization
- a52cea5: Pass event to getResponseStatus in set statusCode
- b47ab2c: Set X-Error for thrown Responses
- bfdd099: better fix for #1552 error propagation with nojs
- 23ee2de: fix #1550, add "X-Content-Raw" header

## 1.0.1

### Patch Changes

- ea64f7c: fix: add error boundary to catch invalid code within the document code
- e0af541: fix up top level errorboundary
- 3ec4138: Fix 'Failed to resolve import' crash during ssr
- 2df3d8b: feat: log errors in production

## 1.0.0

### Major Changes

- 212d592: update to major

### Minor Changes

- 597e99c: replace "." with "()" for nested route escaping

### Patch Changes

- 44dfb5a: Export types properly
- 0499779: fix single flight in ssr false
- 0402c9c: Ensure `nonce` is passed to all assets when rendering from the server.
- 3b2720e: update example project with-trpc
- c09d4bd: Ensure args are encoded when fetching server function
- 486edc6: Respect custom status-codes on redirects
- 7ae0541: update deps
- 8dff006: fix #1463 - grouped api routes
- 25169c1: fix #1441 - closure bug with render options
- 6c30953: Only show preloading js asset warning in dev
- 8711ce0: fix #1415 - incorrectly skipping multi-headers
- 79c17c9: fix type error for vinxi client in tsconfig
- 9348ace: Omit route components from non-SSR builds
- 7cb339f: fix #1410 premature cleanup on mode async
- 771aede: fix #1470 partial route-less paths messing with API
- eb296f2: fix: use `moduleResolution: "bundler"` in examples
- 846f5fd: fix: add app.tsx assets to page event in dev env

## 1.0.0-rc.1

### Patch Changes

- 0402c9c4: Ensure `nonce` is passed to all assets when rendering from the server.
- 3b2720e6: update example project with-trpc
- c09d4bd8: Ensure args are encoded when fetching server function
- 7ae05410: update deps
- 8dff0063: fix #1463 - grouped api routes
- 25169c16: fix #1441 - closure bug with render options
- 8711ce03: fix #1415 - incorrectly skipping multi-headers
- 79c17c96: fix type error for vinxi client in tsconfig
- 7cb339fa: fix #1410 premature cleanup on mode async
- 846f5fd7: fix: add app.tsx assets to page event in dev env

## 1.0.0-rc.0

### Major Changes

- 212d5927: update to major

### Minor Changes

- 597e99ca: replace "." with "()" for nested route escaping

### Patch Changes

- 44dfb5af: Export types properly

## 0.7.7

### Patch Changes

- a0b3027e: fix parsing of new GET encoding on server

## 0.7.6

### Patch Changes

- fca4cec5: proper serialization of GET server function input

## 0.7.5

### Patch Changes

- 13c35307: defineConfig return type
- 70140c24: default to cache static assets

## 0.7.4

### Patch Changes

- 67a469f8: keep all entries as jsx to ensure treated as src

## 0.7.3

### Patch Changes

- 61381f1f: fix: remove dev overlay in prod
- 6c3eff5e: fix #1375 extensions for unprocess .js entries

## 0.7.2

### Patch Changes

- 480802f7: change to ts build
- 090df26b: fix import.meta.env resolution

## 0.7.1

### Patch Changes

- 1891af96: fix #1370 cannot resolve #start/app

## 0.7.0

### Minor Changes

- e33d506e: fix FS router circular dep by moving import
- 7b1c82be: add `.` notation to escape layouts in FS routes
- 28357e62: update config to anticipate Vite updates, clearer experimental features, routesDir
- d491fa8f: remove support for event symbol autoforwarding
- 113c5d53: add serverFunctionMeta
- b9b6eed8: transparent errors and support http status forwarding in server fns

### Patch Changes

- 30862af6: fix types for latest updates
- 32fc1f39: Fix dev overlay's CodeView not working with `mjs` or `cjs` files
- 29ffd16b: don't import app on server for SSR false when SingleFlight false
- 476b8ecf: add back different content type parsing in case middleware etc..
- ea53d37a: update Vinxi and Solid Router
- b19ff69f: revert vite alignment until we know more, add server option to types
- 256488b2: fix #1366 islands mode reference

## 0.6.1

### Patch Changes

- 29e4ec60: Fix refresh pragma
- cbcdde3c: update ts, fix #1346 flash types
- bb6d61ac: Update package.json to include license

## 0.6.0

### Minor Changes

- dbc0c685: Update to vinxi 0.3.3 (thus also Vite 4 -> 5)
- d1a4ec95: move server rendering options to handler
- 3bcfaf16: vite.config -> app.config

### Patch Changes

- eca781a7: configurable dev overlay
- 03a8d1f8: update vinxi, fix prerendering
- 44aa4c05: handler options as function, forward nonce to main scripts
- 516df5da: fix nojs flash update auth/prisma examples

## 0.5.10

### Patch Changes

- 2c503fd0: fix #1342 unintended early return in router < 12.4
- 688a643b: fix: resolve the import path correctly (@solidjs/start/server vs @solidjs/start/./server)
- 35dd4297: fix nojs return responses, fix throw single flight

## 0.5.9

### Patch Changes

- 15f497da: fix empty post bodies in server functions

## 0.5.8

### Patch Changes

- df779e9d: fix json returns from actions

## 0.5.7

### Patch Changes

- 59e8533a: lock vite-plugin-solid into 2.9.x

## 0.5.6

### Patch Changes

- dafdd97a: fix typescript
- b422f708: Fix: calling server functions without arguments, TS strict
- f73de3a6: fix: server functions router should put user plugins before server plugin
- 28691fc3: fix up single flight mutation

## 0.5.5

### Patch Changes

- f787f2b6: update router
- 77e57b2a: Fix #1299, Fix dev overlay logs
- 2cd7a3b3: Fixes incorrect, missing `type` import declarations.
- 2c193283: fix singleflight mutations in non-ALS envs
- 38ba8de8: fix singleflight eating response bodies

## 0.5.4

### Patch Changes

- 0b7eceeb: fix prerender/content-type, stupid copy-paste

## 0.5.3

### Patch Changes

- 4c32e85a: add base url to single flight redirect
- d8bcc5c5: add notes demo, fix redirects in single flight

## 0.5.2

### Patch Changes

- ebe9d0fb: fix up response iterables
- 4d66b4de: Fixed an issue with TypeScript based projects throwing client side errors regarding a type input in the `ErrorBoundary`.wq
- 20697edd: initial support for single flight mutations
- ae6dc628: update Solid to 1.8.14 to fix storage import

## 0.5.1

### Patch Changes

- a57b340f: update references to vinxi/http
- 733400fb: pull API routes back in
- 158f1090: fix storage import, update solid-js
- 11beebd6: fix unocss example
- 7dc792ca: fix tailwind typings

## 0.5.0

### Minor Changes

- 377635b8: move API out of main handler
- 97e0d62e: Add ssr "sync" render mode
- 63d09b0d: Remove old create-solid CLI
- 4311e830: Update to vinxi 0.2.x
- 30f8e521: use ALS for Http helpers
- d5e11006: split out solid event from native event
- 1e0542cf: Add ResponseSub wrapper to RequestEvent
- feb4a515: update entries, stop re-export of vinxi/server
- ca22cc81: update to router 0.11.0

### Patch Changes

- 7d7b073e: improve API route processing with Radix3
- 34c91747: vinxi - 0.1.10, automatic symbol based event discovery
- 6e8b2beb: update router again metadata -> info
- 54501ea6: fix #1278 wrong types for onBeforeResponse middleware
- e811c16a: fix up server function runtime typescript
- 18f2f71a: Add ability to type Locals, cleanup
- 3eb9ae8c: restore API routes to shared path
- 6ef9515f: improve API route passthrough

## 0.4.11

### Patch Changes

- 187acc55: update vinxi, fix #1247, fix #1261
- 92e8f8f8: fix formData and action issue for cloud runtimes
- 27d60cd2: better GET signature
- 24a4eb2e: GET server functions, response returns, cache to use GET
