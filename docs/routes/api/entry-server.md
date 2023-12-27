---
section: api
title: entry-server.tsx
order: 8
subsection: Entrypoints
active: true
---

# entry-server.tsx

##### `entry-server.tsx` is where your app starts on the server.

<div class="text-lg">

```tsx twoslash
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Rendering your application

This file does one thing. It starts your SolidStart application on the server. It does so by passing in our `<StartServer>` to a "render" function. `<StartServer>` takes a document component which will serve as the static document for your application.

## Reference

### `createHandler(renderFn, options)`

This calls the underlying Solid render function, and passes the options to it.

### `<StartServer document={document} />`

Component that wraps our application root.
