# SolidStart

Everything you need to build a Solid project, powered by [`solid-start`](https://start.solidjs.com);

## Creating a project

```bash
# create a new project in the current directory
npm init solid@latest

# create a new project in my-app
npm init solid@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
# start postgres in docker container
npm run dev:db-up

# start cache server
npm run dev:zero-cache

# start the development server
npm run dev:ui
```

Once you change the drizzle schema, you need to update the migration files:

```bash
# update the m
npx drizzle-kit generate
```

## Building

Solid apps are built with _presets_, which optimise your project for deployment to different environments.

By default, `npm run build` will generate a Node app that you can run with `npm start`. To use a different preset, add it to the `devDependencies` in `package.json` and specify in your `app.config.js`.

## Documentation links:

[SolidJS Documentation](https://docs.solidjs.com/)

[Better Auth Documentation](https://www.better-auth.com/docs/introduction)

[Zero Documentation](https://zero.rocicorp.dev/docs/introduction)

[Drizzle ORM Documentation](https://orm.drizzle.team/docs/get-started)

## This project was created with the [Solid CLI](https://solid-cli.netlify.app)
