---
section: api
title: app.tsx
order: 8
subsection: Entrypoints
active: true
---

# app.tsx

##### `app.tsx` defines the document that your application renders.

<div class="text-lg">

```tsx twoslash
import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start";
import { Suspense } from "solid-js";

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>SolidStart - Basic</Title>
          <a href="/">Index</a>
          <a href="/about">About</a>
          <Suspense>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Setting up your application

The `App` component exported from `app.tsx` is the isomorphic (shared on server and browser) entry into your application. This is the point where the code runs on both sides. This is like the classic entry point you would find in Create React App or similar, where you can define your router, and other top level components.

Our basic example (as shown above) includes `@solidjs/router` and `@solidjs/meta`. But this can really be whatever you want.
