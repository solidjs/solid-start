# SolidStart

Everything you need to build a Solid project, powered by [`solid-start`](https://github.com/ryansolid/solid-start/tree/master/packages/solid-start);

## Creating a project

```bash
# create a new project in the current directory
npm init solid@next

# create a new project in my-app
npm init solid@next my-app
```

> Note: the `@next` is temporary

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

Solid apps are built with _adapters_, which optimise your project for deployment to different environments.

By default, `npm run build` will generate a Node app that you can run with `node build`. To use a different adapter, add it to the `devDependencies` in `package.json` and specify in your `vite.config.js`.