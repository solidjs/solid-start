# start-vercel

Adapter for Solid apps that work on Vercel.

This is very experimental; the adapter API isn't at all fleshed out, and things will definitely change.

## Usage

Add the adapter in your `vite.config.js` file. By default this deploys to a Vercel Function.

```js
import solid from "solid-start/vite";
import vercel from "solid-start-vercel";

export default defineConfig({
  plugins: [solid({ adapter: vercel() })]
});
```

To deploy to the edge pass in the edge option.

```js
import solid from "solid-start/vite";
import vercel from "solid-start-vercel";

export default defineConfig({
  plugins: [solid({ adapter: vercel({ edge: true }) })]
});
```

To enable ISR/Prerender, pass in the prerender function.

```js
import { defineConfig } from "vite"
import solid from "solid-start/vite"
import vercel from "solid-start-vercel"

export default defineConfig({
  plugins: [
    solid({
      ssr: true,
      adapter: vercel({
        prerender: true,
      }),
    }),
  ],
})

```

You can also set the `expiration` time and/or the `bypassToken`.

```js
import { defineConfig } from "vite"
import solid from "solid-start/vite"
import vercel from "solid-start-vercel"

export default defineConfig({
  plugins: [
    solid({
      ssr: true,
      adapter: vercel({
        prerender: {
          expiration: 60,
          bypassToken: "87734ad8259d67c3c11747d3e4e112d0",
        },
      }),
    }),
  ],
})
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
