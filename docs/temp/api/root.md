---
section: api
title: root.tsx
order: 8
subsection: Entrypoints
active: true
---

# root.tsx

##### `root.tsx` defines the document that your application renders.

<div class="text-lg">

```tsx twoslash
// @refresh reload
import { Suspense } from "solid-js";
import {
  A,
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title
} from "solid-start";
// ---cut---

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>SolidStart App</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
            <Routes>
              <FileRoutes />
            </Routes>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Setting up your application

The `Root` component exported from `root.tsx` is the isomorphic (shared on server and browser) entry into your application. This is the point where the code runs on both sides. It is laid out like a typical HTML document with the exception the tags are all (capitalized) components. The core entry pieces not found in a typical HTML document are the Suspense and Error Boundaries which act as a harness for handling the loading and error states in our application.

Inside those we define our `<Routes>`. Keep in mind, there are no rules here in terms of where you want to place these. However, we add them by default as `<Suspense>` is required to do asynchronous server rendering and having `<ErrorBoundary>` high up in the tree is a useful catchall especially when developing. Inside the `<Body>` a good place to insert any Components that are shared between all pages. Things like top-level navigation. And inside this file is a good place to put any global Context Providers to inject global state into your application.

## Reference

API reference for the components commonly found in `root.tsx` can be found in the `Document` section:

- [Html](./Html)
- [Head](./Head)
- [Title](./Title)
- [Meta](./Meta)
- [Link](./Link)
- [Style](./Style)
- [Body](./Body)
- [Scripts](./Scripts)
- [ErrorBoundary](./ErrorBoundary)
