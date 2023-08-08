# Changelog

## 0.3.0

This release has a ton of code changes that had been orphaned on an experimental branch. Mostly around Islands router. Biggest update for those is those feature options are under `experimental` option now, and Islands use `use client`. This may not be the final API but it allows us to take the next steps.

```js
// new config
import solid from "solid-start/vite";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [
    solid({
      experimental: { islands: true, islandsRouter: true },
    })
  ]
});
```

We have updated Docs, and added Movies and Notes apps. These only really work under this Islands mode and will serve as a basis as we fill in the features as we work on the R&D that is being funding by the Chrome team.

Now that codebase is completely merged, we can resume our rebase effort with all the code in place.