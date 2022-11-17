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
  plugins: [solid({ adapter: cloudflare({}) })]
});
```

On build this will create a `functions` folder with our `[[path]].js` file which handles all the request. It will also `dist/public` folder with all our assets. That is the target folder for our pages application.

## Build and Deploy

You can run your app in dev with `npm run dev`. But when you want to build for production you can run `npm run build` and `npm run start` to try it locally.

The easiest way to deploy is connect your git repo to Cloudflare pages in their [UI console](https://developers.cloudflare.com/pages/get-started/). You can also deploy directly by CLI by:

```sh
> CLOUDFLARE_ACCOUNT_ID=<ACCOUNT_ID> npx wrangler pages publish dist/public --project-name=<PROJECT_NAME>
```

More info about [direct deploys](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/#deploy-with-wrangler).

## More Info

More info on configuring a cloudflare Pages Functions can be found
[here](https://developers.cloudflare.com/pages/platform/functions/)
