# start-netlify

Adapter for Solid apps that work on in a Netlify function.

This is very experimental; the adapter API isn't at all fleshed out, and things will definitely change.

## Edge Functions

Pass the option `edge` to your adapter to have it deploy to edge functions instead of standard Netlify functions. Edge Functions have support for streaming as well.

```js
import { defineConfig } from "vite";
import solid from "solid-start/vite";
import netlify from "solid-start-netlify";

export default defineConfig({
  plugins: [solid({ adapter: netlify({ edge: true }) })]
});
```

## Configuration

You will be prompted on deploy to choose a publish directory. Type in "netlify".

Alternatively you can setup your netlify.toml to properly locate the built resources.

```toml
[build]
  publish = "netlify/"
```

From here you can run `npm run build` and then `netlify deploy --prod` to deploy.

**Important** When running edge functions they need to be built first so you can do so by running `netlify build` or adding `--build` to your deploy cli command.
