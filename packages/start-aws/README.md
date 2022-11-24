# start-aws

Adapter for Solid apps that work on AWS Lambda and AWS Lambda@Edge.

This is very experimental; the adapter API isn't at all fleshed out, and things will definitely change.

## Usage

Add the adapter in your `vite.config.js` file. By default this deploys to an AWS Lambda Function.

```js
import solid from "solid-start/vite";
import aws from "solid-start-aws";

export default defineConfig({
  plugins: [solid({ adapter: aws() })]
});
```

To deploy to the edge pass in the edge option.

```js
import solid from "solid-start/vite";
import aws from "solid-start-aws";

export default defineConfig({
  plugins: [solid({ adapter: aws({ edge: true }) })]
});
```
