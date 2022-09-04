# start-cloudflare-workers

Adapter for Solid apps that work on Cloudflare Workers.

This is very experimental; the adapter API isn't at all fleshed out, and things will definitely change.

## Configuration

This adapter expects to find a [wrangler.toml](https://developers.cloudflare.com/workers/platform/sites/configuration) file in the project root. It will determine where to write static assets and the worker based on the `site.bucket` and `site.entry-point` settings.

Generate this file using `wrangler` from your project directory

```sh
$ wrangler init
```

Then configure your sites build directory in the config file:

```toml
type = "javascript"
[site]
bucket = "./dist"
entry-point = "./"
[build]
command = ""
upload.format = "service-worker"
```

You also need to add the main entry to your package.json:
```
"main": "./dist/server.js",
```

More info on configuring a cloudflare worker site can be found [here](https://developers.cloudflare.com/workers/platform/sites/start-from-existing)