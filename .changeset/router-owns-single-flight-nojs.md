---
"@solidjs/start": patch
---

Adopt the router's server-function integration: single-flight payload collection and the no-JS flash-cookie form convention are `@solidjs/router`'s now (its vocabulary — query cache keys, submissions — was always the payload). Start's `handleSingleFlight` (data-only app render), `createSingleFlightHeaders`, `handleNoJS`, and the flash-cookie SSR seeding are deleted; the server-function handler wires `createFlightDataCollector({ routes: createRoutes, base })` — the router's pure preload runner over the file-system route tree, no app render involved — and `createNoJSHandler({ base })` from `@solidjs/router/server` into the core handler hooks. Client-side single-flight opt-in is automatic: the router registers itself as the transport's flight-data consumer, so per-call `X-Single-Flight` headers are gone too.
