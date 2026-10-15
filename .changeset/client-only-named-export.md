---
"@solidjs/start": patch
---

Let a `clientOnly` loader resolve to the component itself, so a named export works without wrapping it in `{ default }`:

```tsx
const Chart = clientOnly(() => import("./chart").then(({ Chart }) => Chart));
```

Destructuring the export inside the loader also lets the bundler leave the module's other exports out of the chunk.
