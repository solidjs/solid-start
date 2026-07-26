---
"@solidjs/start": minor
---

Include the server function id in its request URL

Server function calls now go to `_server/<id>` instead of a bare `_server`, so
access logs, traces and the network panel can tell functions apart instead of
collapsing every call into one entry. Ids contain the function's source name in
development, e.g. `POST /_server/a1b2c3-0-getUser`.

Production ids stay opaque by default. Set `serverFunctions.readableIds` to keep
the names in production builds too:

```js
import { solidStart } from "@solidjs/start/config";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solidStart({ serverFunctions: { readableIds: true } })],
});
```

Requests to the previous `_server?id=<id>` URL are still handled, so bookmarked
or hand-written URLs keep working.
