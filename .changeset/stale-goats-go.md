---
"@solidjs/start": minor
---

The file filter logic used for CSS crawling in development can now be configured with the vite plugin option `css.filter` analog to `serverFunctions.filter`:

```ts
solidStart({
  css: {
    filter: {
      // Exclude all node_modules expect "my-dependency"
      exclude: "node_modules/!(my-dependency)/**/*",
    },
  },
});
```
