---
section: api
title: Meta
order: 4
subsection: Document
active: true
---

# Meta

##### `Meta` is a component that renders the `meta` element on the server, and hydrates it on the client.

<div class="text-lg>

```tsx twoslash
import { Meta } from "solid-start";
// ---cut---
<Meta name="description" content="My site description" />
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Adding `meta` tag to all routes

```tsx twoslash {5-7}
import { Html, Head, Title, Meta, Link } from "solid-start";
// ---cut---
export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta name="description" content="Hacker News Clone built with Solid" />
      </Head>
    </Html>
  );
}
```

### Adding a `meta` tag for a specific page

```tsx twoslash {4}
import { Meta } from "solid-start";
// ---cut---
export default function MyPage() {
  return (
    <>
      <Meta name="description" content="My site is even better now we are on MyPage" />
      <h1>My Super Cool Page</h1>
    </>
  );
}
```

## Reference

### `<Meta />`

The `<Meta>` component represents metadata that cannot be represented by other HTML elements. It is a wrapper of the native [`meta`][nativemeta] element and has the same properties. It is a re-export from `@solidjs/meta`.

`Meta` components may be placed in the `Head` or can be added throughout the application to add additional metadata or override parents. `Meta` tags are consider to be the same and are overridden if the `name` attribute matches.

[nativemeta]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta
