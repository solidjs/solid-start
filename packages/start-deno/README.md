# solid-start-deno

Adapter for Solid apps that work on Deno Deploy.

This is very experimental; the adapter API isn't at all fleshed out, and things will definitely change.

## Configuration

- [Install Deno](https://deno.land/manual/getting_started/installation)
- Install Deno Deploy CLI
  ```bash
  deno install --allow-read --allow-write --allow-env --allow-net --allow-run --no-check -r -f https://deno.land/x/deploy/deployctl.ts
  ```

You also need to add the main entry to your package.json:

# Deploy

0. Build your app with SolidStart

```bash
npm run build
```

1. Create a project with `<your-project-name>` name on [Deno Deploy](https://deno.land/deploy/).

2. `cd dist`

3. Use the [Deno Deploy CLI](https://github.com/denoland/deployctl) to deploy your app.

```bash
$ project/dist > deployctl deploy --prod --project=<YOUR_PROJECT_NAME> --token <YOUR_DENO_DEPLOY_TOKEN> ./index.js
```
