---
section: api
title: Head
order: 2
subsection: Document
---

# Head

##### `Head` lets you set the `<head>` of your page

<div class="text-lg">

```tsx twoslash
import { Head, Html, Title, Meta, Link, Body } from "solid-start";
// ---cut---
<Head>
  <Title>Hogwarts</Title>
</Head>
```

## Usage

### Setting the `<head>` of your page

The `Head` component includes machine-readable metadata about the document, like its title, description of its content, and links to scripts and stylesheets. It is a wrapper over the `head` element and accepts the same attributes. It accepts elements you would place under `head`, like `title`, `meta`, and `link` along with their wrapped counterparts.

The `Head` component also automatically inserts any `link` elements for preloading JavaScript and CSS for the current page and handles the insertion of any meta-tags that are added throughout the application.

It and its descendants are not hydrated on page bootup in the browser after server rendering.

The <token-link id="1" token="Html">`Head`</token-link> is required to be a child of `Html` and should be the first child of <token-link id="1" token="Html">`Html`</token-link>. It serves a few purposes, and a document without the `Head` component will not render correctly.

```tsx twoslash mark=4[5:8]
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


