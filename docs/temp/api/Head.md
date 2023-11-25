---
section: api
title: Head
order: 2
subsection: Document
active: true
---

# Head

##### `Head` lets you set the [`<head>`][nativehead] of your page.

<div class="text-lg">

```tsx twoslash
import { Head, Html, Title, Meta, Link, Body } from "solid-start";
// ---cut---
<Head>
  <Title>Hogwarts</Title>
</Head>
```

</div>

## Usage

### Setting the `<head>` of your page

The `Head` component includes machine-readable metadata about the document, like its title, description of its content, links to scripts, and stylesheets.

It is a wrapper over the [`head`][nativehead] element and accepts the same attributes. It accepts elements you would usually place under [`head`][nativehead], like [`title`][nativetitle], [`meta`][nativemeta], and [`link`][nativelink] along with their wrapped counterparts.

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

## Reference

### `<Head />`

Use the `Head` component as the first child of [`Html`][html] to set the [`<head>`][nativehead] of your page. It is necessary to have this otherwise your app will break in production (probably in dev too).

The `Head` component automatically inserts any `link` elements needed for preloading JavaScript and CSS for the current page. It handles the insertion of any meta-tags that are added throughout the application.

`Head` and its descendants are not hydrated on page boot up in the browser after server rendering. It accepts the same props as the native [`<head>`][nativehead] element.

```tsx twoslash
import { Html, Head } from "solid-start";

export default function Root() {
  return (
    <Html>
      <Head>...</Head>
    </Html>
  );
}
```

[nativehead]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head
[nativetitle]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title
[nativemeta]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta
[nativelink]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
[html]: /api/Html
