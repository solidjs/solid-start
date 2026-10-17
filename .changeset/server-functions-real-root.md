---
"@solidjs/start": patch
---

Resolve the server function filter and the ids of lazily loaded modules against Vite's root instead of the working directory. On Windows a working directory entered through a junction or symlink keeps that path, while Vite (8.2 and later) resolves the root and every module id to the real path. The filter then matched no module, so no `"use server"` function was compiled: its body shipped in the client bundle, and the build failed with `Attempt to import 'server-only' in a client module` once one of them imported server-only code such as `@solidjs/start/http`. The ids of lazily loaded route components matched no client manifest entry either, so their CSS was missing from the server-rendered HTML. Relative patterns in the `serverFunctions.filter` option now resolve against Vite's root too.
