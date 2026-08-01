---
"@solidjs/start": minor
---

The file filter logic used for CSS crawling in development can now be configured with the vite plugin option `css.filter` analog to `serverFunctions.filter`:

```ts
solidStart({
  css: {
    filter: {
      // Exclude all node_modules except "my-dependency" with a flat node_modules layout
      exclude: "node_modules/!(my-dependency)/**/*",
    },
  },
});
```

With pnpm, Vite may resolve dependencies through the nested `.pnpm` directory. Use a regular expression that accounts for that layout:

```ts
solidStart({
  css: {
    filter: {
      exclude: /node_modules\/(?!(?:\.pnpm\/[^/]+\/node_modules\/)?my-dependency(?:\/|$))/,
    },
  },
});
```
