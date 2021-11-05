# start-netlify

Adapter for Solid apps that work on in a Netlify function.

This is very experimental; the adapter API isn't at all fleshed out, and things will definitely change.

## Configuration

You need to setup your netlify.toml to properly locate the built resources.

```toml
[build]
  publish = "dist/"

[functions]
  directory = "dist/functions"

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/index"
  status = 200
```

From here you can run `npm run build` and then `netlify deploy -prod` to deploy.