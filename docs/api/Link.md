---
section: api
title: Link
order: 5
subsection: Document
---

# Link

```tsx twoslash
import { Html, Head, Link } from "solid-start";
// ---cut---
export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Link rel="manifest" href="/manifest.webmanifest" />
      </Head>
    </Html>
  );
}
```

The `Link` component specifies a relationship between the page and an external resource. Most commonly used for things like stylesheets, but it can handle a number of different associations. It is a wrapper of the `link` element and is a re-export from `@solidjs/meta`.

`Link` components can not only be added to `Head` but also across your application allowing dynamic addition and removal depending on if currently mounted.

```tsx twoslash
import { Link } from "solid-start";
// ---cut---
export default function MyPage() {
  return (
    <>
      <Link rel="stylesheet" href="my-page.css" />
      <h1>My Super Cool Page</h1>
    </>
  );
}
```
