# start-vercel

Adapter for Solid apps that work on Vercel.

This is very experimental; the adapter API isn't at all fleshed out, and things will definitely change.

So far this only supports Edge functions but we intend to extend this to other output formats.

## Usage

Add the adapter in your `vite.config.js` file

```js
import solid from "solid-start/vite";
import vercel from "solid-start-vercel";

export default defineConfig({
  plugins: [solid({ adapter: vercel() })]
});
```

## Configuration

You will need to have the [vercel-cli](https://vercel.com/docs/cli) installed globally.

```bash
> npm i -g vercel
```

This adapter makes use of the [Build Output API](https://vercel.com/docs/build-output-api/v3) which you need to enable through the Vercel CLI

```bash
> vercel env add ENABLE_VC_BUILD
```

follow the prompts to set it to `1` for all environments
