# start-cloudflare-workers

Adapter for Solid apps that work on Cloudflare Workers.

This is very experimental; the adapter API isn't at all fleshed out, and things will definitely change.

## Configuration

This adapter expects to find a [wrangler.toml](https://developers.cloudflare.com/workers/platform/sites/configuration) file in the project root. It will determine where to write static assets and the worker based on the `site.bucket` settings.

Generate this file using `wrangler` from your project directory

```sh
$ wrangler init
```

Then configure your sites build directory in the config file:

```toml
main = "./dist/server.js"
[site]
bucket = "./dist/public"
```

More info on configuring a cloudflare worker site can be found [here](https://developers.cloudflare.com/workers/platform/sites/start-from-existing)

## Durable Objects

During development Durable Objects must be defined in the adapters initialization.

```js
adapter: cloudflareWorkers({
  durableObjects: {
    DO_WEBSOCKET: "WebSocketDurableObject"
  }
});
```

The key of the object is the Durable Object name and the string is the Durable Object Class name (What the Durable Object should be exported as in `entry-server.tsx`).
