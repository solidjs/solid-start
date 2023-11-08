---
section: api
title: Body
order: 7
subsection: Document
active: true
---

# Body

##### `Body` is an enhanced version of the [`body`][nativebody] element that knows how to render the app for the various SolidStart modes.

<div class="text-lg">

```tsx twoslash
import { Body } from "solid-start";
// ---cut---
<Body>...</Body>
```

</div>

<table-of-contents></table-of-contents>

## Usage

The `Body` component is the entry point into our applications. Here is where we insert the top level visual elements of our page live, as well as things like our `Routes` definition. It wraps the `body` element and accepts all the same attributes.

It is also the starting point for hydration for general Server-Side rendering and root of client rendering for non-SSR mode.

It is a required component and should usually be placed as an immediate child of the `Html` component, after the `Head` element. It should include a `Scripts` component and render a `Routes` component to render your application.

```tsx twoslash {7-13} filename="root.tsx"
function MyNav() {
  return <></>
}

// ---cut---
import { Html, Head, Body, Routes, FileRoutes, Scripts } from "solid-start";

export default function Root() {
  return (
    <Html>
      <Head />
      <Body>
        <MyNav />
        <Routes>
          <FileRoutes />
        </Routes>
        <Scripts />
      </Body>
    </Html>
  );
}
```

The cool part is that you don't have to change any of this as you try out SPA, SSR, Islands, Island Routing or any of SolidStart's other capabilities.

[nativebody]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body
