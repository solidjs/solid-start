---
section: api
title: Head
order: 2
subsection: Document
---

# Head

```tsx twoslash
import { Html, Head, Title, Meta, Link } from "solid-start";
// ---cut---
export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>Solid - Hacker News</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta name="description" content="Hacker News Clone built with Solid" />
        <Link rel="manifest" href="/manifest.webmanifest" />
      </Head>
    </Html>
  );
}
```

The `Head` component includes machine-readable metadata about the document, like its title, description of its content, and links to scripts and stylesheets. It is a wrapper over the `head` element and accepts the same attributes. It accepts elements you would place under `head`, like `title`, `meta`, and `link` along with their wrapped counterparts.

The `Head` component also automatically inserts any `link` elements for preloading JavaScript and CSS for the current page and handles the insertion of any meta-tags that are added throughout the application.

It and its descendants are not hydrated on page bootup in the browser after server rendering.
