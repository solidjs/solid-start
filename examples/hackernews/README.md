# SolidStart Hackernews Example

Hackernews example powered by [`solid-start`](https://github.com/ryansolid/solid-start/tree/master/packages/solid-start);

```bash
npm init solid -- --template hackernews
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/solidjs/solid-start/tree/main/examples/hackernews)

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

SolidStart apps are built with _adapters_, which optimise your project for deployment to different environments.

By default, `npm run build` will generate a Node app that you can run with `npm run start`. To use a different adapter, add it to the `devDependencies` in `package.json` and specify in your `vite.config.js`.
