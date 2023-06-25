# SolidStart / Supabase Example

Everything you need to build a Solid project, powered by [`solid-start`](https://start.solidjs.com);

## Important Supabase/Solid Start information

In order for the Supabase integration to work successfully, there are a couple of rules that you need to understand but aren't really discussed in the Supabase docs:

1. Supabase Auth can _only_ be done on the client-side via the `createBrowserClient` helper.
2. Once you have authenticated with Supabase, _then_ you can fetch any data on the server you want via the `createServerClient` helper.

This example app does user Server-rendering. However, if you are only interested in building a client-side app, then you can just use the Supabase API as mentioned in the docs and do not need any helper library.

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

Solid apps are built with _adapters_, which optimise your project for deployment to different environments.

By default, `npm run build` will generate a Node app that you can run with `npm start`. To use a different adapter, add it to the `devDependencies` in `package.json` and specify in your `vite.config.js`.
