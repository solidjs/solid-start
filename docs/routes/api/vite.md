---
section: api
title: vite.config.ts
order: 8
subsection: Entrypoints
active: true
---

# vite.config.ts

##### `vite.config.ts` is where you configure your application.

<div class="text-lg">

```tsx
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  start: {
    server: {
      preset: "netlify"
    }
  }
});
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Configuring your application

SolidStart is built with [Vite](https://vitejs.dev) and [Nitro](https://nitro.unjs.io). It is little more than a collection of Vite plugins that enable all the functionality that we see here. This is an incredibly powerful approach as we get to leverage Vite's whole ecosystem of plugins to enhance our applications.

The core configuration used by SolidStart is found at `@solidjs/start/config`. SolidStart uses Nitro which can run on a number of platforms.

- Node
- Static hosting
- Netlify Functions & Edge
- Vercel Functions & Edge
- AWS Lambda & Lambda@Edge
- Cloudflare Workers & Pages
- Deno Deploy

The simplest usage is passing no arguments, which defaults to the Node preset. Some presets may be autodetected by the provider. Otherwise they must added to the configuration via the `start.server.preset` option. For example, this uses Netlify Edge:

```tsx
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  start: {
    server: {
      preset: "netlify_edge"
    }
  }
});
```

#### Special Note

SolidStart uses Async Local Storage. Not all non-node platforms support it out of the box. Netlify, Vercel, and Deno should just work. But for Cloudflare you will need specific config:

```js
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  start: {
    server: {
      preset: "cloudflare_module",
      rollupConfig: {
        external: ["__STATIC_CONTENT_MANIFEST", "node:async_hooks"]
      }
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
- `ssr` (_boolean_ | "sync" | "async", default `true`): Providing a boolean value will toggle between client rendering and [streaming](https://docs.solidjs.com/references/concepts/ssr/streaming) server rendering (ssr) mode,  while "sync" and "async" will render using Solid's [renderToString](https://docs.solidjs.com/references/concepts/ssr/simple-client-fetching-ssr) and [renderToStringAsync](https://docs.solidjs.com/references/concepts/ssr/async-ssr) respectively.
- `islands` (_boolean_, default `false`): _experimental_ toggles on "islands" mode.
