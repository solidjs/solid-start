# solid-start-deno

Adapter for Solid apps that work on Deno Deploy.

This is very experimental; the adapter API isn't at all fleshed out, and things will definitely change.

## Configuration

Install Deno



You also need to add the main entry to your package.json:

```
"main": "./dist/index.js",
```

More info on configuring a cloudflare worker site can be found [here](https://developers.cloudflare.com/workers/platform/sites/start-from-existing)
