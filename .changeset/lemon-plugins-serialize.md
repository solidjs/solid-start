---
"@solidjs/start": minor
---

Add `serialization.plugins` to configure custom Seroval plugins for server functions.

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
