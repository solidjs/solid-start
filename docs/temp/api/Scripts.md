---
section: api
title: Scripts
order: 8
subsection: Document
active: true
---

# Scripts

##### `Scripts` is a collection of scripts that can be used to build your app.

<div class="text-lg">

```tsx twoslash
import { Scripts } from 'solid-start'
// ---cut---
<Scripts />
```

</div>

<table-of-contents></table-of-contents>

## Usage

```tsx twoslash
import { Html, Head, Body, Routes, FileRoutes, Scripts } from "solid-start";

export default function Root() {
  return (
    <Html lang="en">
      <Head></Head>
      <Body>
        <Routes>
          <FileRoutes />
        </Routes>
        <Scripts />
      </Body>
    </Html>
  );
}
```

The `Scripts` component injects JavaScript on the page. This includes the `script` element for your JavaScript entry point, the inline script used to start hydration before JavaScript has loaded, and any resource serialization data available at the time the page is initially sent.

Removing the `Scripts` component allows your application to ship 0kb of JavaScript and rely on the shipped HTML to provide an interactive experience by leveraging native anchor links and our progressive-enhanced `Form` actions.

<aside title="Don't remove the Scripts" type="warning">
It is generally not recommended to remove the Scripts as SolidStart provides other more progressive means to offer low JavaScript solutions, like our experimental "islands" mode. It also disables features like streaming. While having a site that doesn't break when things go wrong, it is no replacement for JavaScript powered experiences.
</aside>