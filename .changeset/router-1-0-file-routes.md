---
"@solidjs/start": patch
---

Migrate to `@solidjs/router` 1.0.0-next.7, which removes the component API in favor of the `createRouter` factory. `@solidjs/start/router` now exports the file-system route tree as a value — `fileRoutes` — instead of the `FileRoutes` component (there is no JSX children slot to mount it in anymore); apps pass it straight to the factory:

```tsx
import { createRouter } from "@solidjs/router";
import { fileRoutes } from "@solidjs/start/router";

const Router = createRouter({ routes: fileRoutes });

export default function App() {
  return <Router>{props => <Loading>{props.children}</Loading>}</Router>;
}
```

Routes are immutable per router instance, so one shared tree serves every request and mount: `PageEvent.routes` (and the per-request tree build in `createPageEvent`) is gone, and the single-flight collector consumes `fileRoutes` directly. The old `root` prop becomes the render-prop child and `rootPreload` becomes the factory's `preload` option; active-link styling moves from the removed `<A>` component's `active` class to the router's anchor attribute vocabulary (`[data-active]`, `[aria-current="page"]`).
