# Vite-Plugin-Nitro-2

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
