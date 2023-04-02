# SolidStart + AuthJS

Everything you need to build an [AuthJS](https://authjs.dev/) authenticated Solid project, powered by [`solid-start`](https://start.solidjs.com);

## Developing

Once you've installed dependencies with `npm install` (or `pnpm install` or `yarn`), create an `.env` file from the `.env.example` template by running:

```bash
cp .env.example .env
```

Add `.env` to your `.gitignore`. Go [here](https://discord.com/developers/applications) and create an application. Use any name, and add `http://localhost:3000/api/auth/callback/discord` and/or `https://localhost:3000/api/auth/callback/discord` as "Redirects" under "OAuth2". Copy `CLIENT ID` and `CLIENT SECRET` from that page to the your new `.env` file. Generate a random value by running  `openssl rand -hex 32` or by going [here](https://generate-secret.vercel.app/32). Paste that random value into `AUTH_SECRET` in your  `.env` file.

Start your development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

Click "Sign In", log in, "Authorize", and that's it!

## HTTPS

You may wish to use a self-signed certificate to use HTTPS locally. In order of increasing complexity, you have a few options:

1. [@vitejs/plugin-basic-ssl](https://github.com/vitejs/vite-plugin-basic-ssl). This has the disadvantage of your OS not recognizing the cert, and therefore displaying a _"Your connection is not private"_ (or similar) warning screen.
2. [mkcert](https://github.com/FiloSottile/mkcert).
3. [Google how to generate a self-signed certificate](https://www.google.com/search?q=how+to+generate+a+self+signed+certificate) for your operating system. If you wish to avoid the _"Your connection is not private"_ warning, you'll need to install a [root certificate](https://en.wikipedia.org/wiki/Root_certificate) then generate the self-signed certificate using that.

The rest of these instructions will assume Option 2, though Option 1 and 3 users may proceed by jumping to Step 3.

1. [Install mkcert](https://github.com/FiloSottile/mkcert#installation). WSL users may have [a few more steps](https://github.com/FiloSottile/mkcert/issues/357#issuecomment-1466762021).
2. Run `mkcert -key-file key.pem -cert-file cert.pem localhost`
   - This generates a cert for `localhost` and not `127.0.0.1`. If you wish to add `127.0.0.1`, run `mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1`. Update your Discord OAuth2 Redirects.
3. Add `key.pem` and `cert.pem` to your `.gitignore`.
4. Add `key.pem` and `cert.pem` to the [`server.https`](https://vitejs.dev/config/server-options.html#server-https) and [`preview.https`](https://vitejs.dev/config/preview-options.html#preview-https) sections of your `vite.config.ts`; e.g.

```ts
import fs from "fs";
import solid from "solid-start/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solid()],
  server: {
    https: {
      key: fs.readFileSync("./key.pem"),
      cert: fs.readFileSync("./cert.pem"),
    },
  },
  preview: {
    https: {
      key: fs.readFileSync("./key.pem"),
      cert: fs.readFileSync("./cert.pem"),
    },
  },
});
```
Option 1 users may skip the above step.

5. Go to https://localhost:3000/ and login!

## Building

Solid apps are built with _adapters_, which optimise your project for deployment to different environments.

By default, `npm run build` will generate a Node app that you can run with `npm start`. To use a different adapter, add it to the `devDependencies` in `package.json` and specify in your `vite.config.js`.
