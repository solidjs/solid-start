---
section: api
title: Html
order: 1
subsection: Document
active: true
---

# Html

##### `Html` is a component that renders the `html` element on the server, and hydrates its body on the client.

```tsx twoslash
import { Html, Head, Body } from "solid-start";
// ---cut---
<Html lang="en">
  <Head />
  <Body>...</Body>
</Html>
```

<table-of-contents></table-of-contents>

## Usage

The `Html` Component represents the root of our document and is a wrapper over the native `html` tag. It accepts any attributes assignable to the native `HTMLHtmlElement`. All rendered elements must be a descendant of `Html` and all server rendered elements under it unless also under `Body` are not hydrated.

```tsx twoslash {2,10}
import { Html, Head, Body, Routes, FileRoutes, Scripts } from "solid-start";
// ---cut---
export default function Root() {
  <Html lang="en">
    <Head />
    <Body>
      <Routes>
        <FileRoutes />
      </Routes>
      <Scripts />
    </Body>
  </Html>
}
```

It is required to have a `Head` and `Body` component as children of `Html`. The `Head` component is used to render the `head` element on the server and hydrate it on the client. The `Body` component is used to render the `body` element on the server and hydrate it on the client. There is only one reason to not have a `Html` component as the root of your application and that is if you are using an `index.html` for your SPA.