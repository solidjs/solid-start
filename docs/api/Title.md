---
section: api
title: Title
order: 3
subsection: Document
---

# Title

```tsx twoslash
import { Html, Head, Title, Meta, Link } from "solid-start";
// ---cut---
export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>Default Application Title</Title>
      </Head>
    </Html>
  );
}
```

The `Title` tag contains the title for the page that is rendered in the browsers top tab bar. It is a wrapper of the `title` element and is a re-export from `@solidjs/meta`. These are typical placed in the `Head` element but can also be placed throughout your application code to overwrite the current title. A `Title` lower in the tree will override a parents.

```tsx twoslash
import { Title } from "solid-start";
// ---cut---
export default function MyPage() {
  return (
    <>
      <Title>My Page Title</Title>
      <h1>My Super Cool Page</h1>
    </>
  );
}
```