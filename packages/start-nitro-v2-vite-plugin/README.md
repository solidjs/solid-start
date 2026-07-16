# Vite-Plugin-Nitro-2

> [!WARNING]
> This Nitro v2 plugin is deprecated. For new projects, use Nitro v3 and its official Vite plugin instead:
>
> ```ts
> import { solidStart } from "@solidjs/start/config";
> import { nitro } from "nitro/vite";
> import { defineConfig } from "vite";
>
> export default defineConfig({
>   plugins: [solidStart(), nitro({ preset: "node-server" })]
> });
> ```
>
> See the official [SolidStart templates](https://github.com/solidjs/templates/tree/main/solid-start-v2) for complete, up-to-date examples.

This package moves Nitro into a Vite-Plugin to consolidate the API surface between Nitro v2 and v3.

## Usage

This plugin will provide SolidStart with the needed Node.js runtime to run in the backend.

```ts
import { defineConfig } from "vite";
import { nitroV2Plugin } from "@solidjs/vite-plugin-nitro-2";
import { solidStart } from "@solidjs/start/config";

export default defineConfig({
  plugins: [solidStart(), nitroV2Plugin()]
});
```

Some features that previously were re-exported by SolidStart are available directly through this plugin now.

### Example: Prerendering

```ts
import { defineConfig } from "vite";
import { nitroV2Plugin } from "@solidjs/vite-plugin-nitro-2";
import { solidStart } from "@solidjs/start/config";

export default defineConfig({
  plugins: [
    solidStart(),
    nitroV2Plugin({
      prerender: {
        crawlLinks: true
      }
    })
  ]
});
```
