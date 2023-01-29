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
import netlify from "solid-start-netlify";
import solid from "solid-start/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    solid({
      adapter: netlify({ edge: true })
    })
  ]
});
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Configuring your application

SolidStart is built with [Vite](https://vitejs.dev). It is little more than a collection of Vite plugins that enable all the functionality that we see here. This is an incredibly powerful approach as we get to leverage Vite's whole ecosystem of plugins to enhance our applications.

The core plugin used by SolidStart is found at `solid-start/vite`. The main configuration for it is setting the adapter. Adapter's in SolidStart set the environment to which your project is deployed. Currently, SolidStart supports:

- Node
- Static hosting
- Netlify Functions & Edge
- Vercel Functions & Edge
- AWS Lambda & Lambda@Edge
- Cloudflare Workers & Pages
- Deno Deploy

The simplest usage is passing no arguments, which defaults to the Node adapter. Other adapters must be installed in your project and added to the configuration via the `adapter` option. For example, this uses Netlify Edge:

```tsx
import netlify from "solid-start-netlify";
import solid from "solid-start/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    solid({
      adapter: netlify({ edge: true })
    })
  ]
});
```

## Reference

### `solid-start/vite`

The vite plugin exposes the following options:

- `adapter` (_string_ | Adapter, default `"node"`): sets the adapter.
- `appRoot` (_string_, default `"./src"`): sets the root of the application code.
- `routesDir` (_string_, default `"./routes"`): the path to where the routes are located.
- `rootEntry` (_string_, default `"./root.tsx"`): the file path where to the root.
- `clientEntry` (_string_, default `"./entry-client.tsx"`): the file path where to the client entry.
- `serverEntry` (_string_, default `"./entry-server.tsx"`): the file path where to the server entry.
- `prerenderRoutes` (_string[]_, default `[]`): list of route paths to prerender (currently only works with static adapter).
- `inspect` (_boolean_, default `true`): turns on whether vite inspect plugin is enabled.
- `ssr` (_boolean_, default `true`): toggles between client rendering and server rendering (ssr) mode.
- `islands` (_boolean_, default `false`): _experimental_ toggles on "islands" mode.
- `islandsRouter` (_boolean_, default `false`): _experimental_ toggles on hybrid "islands" routing.
