# Solid Start

This is the SolidStart framework and CLI.

The quickest way to get started:

```bash
mkdir my-app
cd my-app
npm init solid@latest
npm install
npm run dev
```

## Plugin Options:

WIP this will change

```js
{
  preferStreaming: true, // use Streaming SSR on platforms that support it
  hot: true, // HMR in dev
  adapter: adaptor(), // import adapter and initialize
  prerenderRoutes: [] // routes that should be pre-rendered in static adapter
}
```
