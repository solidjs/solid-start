# @solidjs/start

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
