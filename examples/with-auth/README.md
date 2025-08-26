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
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Env Vars

Rename the example file and add your Discord OAuth credentials:

```bash
# rename example environment file
cp .env.example .env
```

Edit `.env` with your values:

```dotenv
DISCORD_ID=your-discord-client-id
DISCORD_SECRET=your-discord-client-secret
```

1. Create an application at [https://discord.com/developers/applications](https://discord.com/developers/applications) to obtain your client ID and secret.
2. In the app's **OAuth2 → Redirects** settings, add:

   ```text
   http://localhost:3000/api/oauth/discord
   ```

For more details on the [start-oauth](https://github.com/thomasbuilds/start-oauth) integration, see the repository.

## Building

Solid apps are built with _presets_, which optimise your project for deployment to different environments.

By default, `npm run build` will generate a Node app that you can run with `npm start`. To use a different preset, add it to the `devDependencies` in `package.json` and specify in your `app.config.js`.
