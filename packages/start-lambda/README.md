# start-netlify

Adapter for Solid apps that work Lambda or Lambda@Edge

This is very experimental; the adapter API isn't at all fleshed out, and things will definitely change.

## Edge Functions

Pass the option `edge` to your adapter to have it build for Lambda@Edge instead of Lambda

```js
import solid from "solid-start";
import lambda from "solid-start-lambda";

export default defineConfig({
  plugins: [solid({ adapter: lambda({ edge: true }) })]
});
```


