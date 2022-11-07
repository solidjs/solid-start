# start-cloudflare-pages

Adapter for Solid apps that work on Cloudflare Pages Functions.

## Get Started

Install `solid-start-cloudflare-pages`

Configure it in your vite config:
```js
import { defineConfig } from "vite";
import solid from "solid-start/vite";
import cloudflare from "solid-start-cloudflare-pages";

export default defineConfig({
  plugins: [solid({ adapter: cloudflare() })]
});
```

On build this will create a `functions` folder with our `[[path]].js` file which handles all the request. It will also `dist/public` folder with all our assets. That is the target folder for our pages application.

More info on configuring a cloudflare Pages Functions can be found
[here](https://developers.cloudflare.com/pages/platform/functions/)
