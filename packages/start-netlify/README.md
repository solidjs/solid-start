# start-netlify

Adapter for Solid apps that work on in a Netlify function.

This is very experimental; the adapter API isn't at all fleshed out, and things will definitely change.

## Configuration

You will be prompted on deploy to choose a publish directory. Type in "netlify".

Alternatively you can setup your netlify.toml to properly locate the built resources.

```toml
[build]
  publish = "netlify/"
```

From here you can run `npm run build` and then `netlify deploy -prod` to deploy.