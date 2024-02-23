---
section: api
title: app.config.ts
order: 8
subsection: Entrypoints
active: true
---

# app.config.ts

##### `app.config.ts` is where you configure your application.

<div class="text-lg">

```tsx
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  vite: {
    // vite options
    plugins: []
  },
  server: {
    preset: "netlify"
  }
});
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Configuring your application

SolidStart is built on top of [Vinxi](https://vinxi.vercel.app/) which combines the power of [Vite](https://vitejs.dev) and [Nitro](https://nitro.unjs.io).

The core configuration used by SolidStart is found at `@solidjs/start/config`.

SolidStart supports most vite options, including plugins via the `vite` option:

```tsx
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  vite: {
    // vite options
    plugins: []
  }
});
```

The `vite` option can also be a function which can be customized for each Vinxi Router. In SolidStart we use 3, `server` for SSR, `client` for the browser, and `server-function` for server functions.

```tsx
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  vite({ router }) {
    if (router === "server") {
    } else if (router === "client") {
    } else if (router === "server-function") {
    }
    return { plugins: [] };
  }
});
```

SolidStart uses Nitro which can run on a number of platforms. The `server` option exposes some Nitro options including deployment presets.

- Node
- Static hosting
- Netlify Functions & Edge
- Vercel Functions & Edge
- AWS Lambda & Lambda@Edge
- Cloudflare Workers & Pages
- Deno Deploy

The simplest usage is passing no arguments, which defaults to the Node preset. Some presets may be autodetected by the provider. Otherwise they must added to the configuration via the `server.preset` option. For example, this uses Netlify Edge:

```tsx
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  server: {
    preset: "netlify_edge"
  }
});
```

#### Special Note

SolidStart uses Async Local Storage. Not all non-node platforms support it out of the box. Netlify, Vercel, and Deno should just work. But for Cloudflare you will need specific config:

```js
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  server: {
    preset: "cloudflare_module",
    rollupConfig: {
      external: ["__STATIC_CONTENT_MANIFEST", "node:async_hooks"]
    }
  }
});
```

And enable node compat in your wrangler.toml.

```
compatibility_flags = [ "nodejs_compat" ]
```

## Reference

### `@solidjs/start/config`

The vite options are same as the default with exception of the `start` property exposes the following options:

- `server` (_object_): Nitro server config options
- `appRoot` (_string_, default `"./src"`): Sets the root of the application code.
- `routesDir` (_string_, default `"./routes"`): The path to where the routes are located.
- `ssr` (_boolean_ | "sync" | "async", default `true`): Providing a boolean value will toggle between client rendering and [streaming](https://docs.solidjs.com/references/concepts/ssr/streaming) server rendering (ssr) mode, while "sync" and "async" will render using Solid's [renderToString](https://docs.solidjs.com/references/concepts/ssr/simple-client-fetching-ssr) and [renderToStringAsync](https://docs.solidjs.com/references/concepts/ssr/async-ssr) respectively.
- `islands` (_boolean_, default `false`): _experimental_ toggles on "islands" mode.
