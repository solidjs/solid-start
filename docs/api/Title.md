---
section: api
title: Title
order: 3
subsection: Document
active: true
---

# Title

##### `Title` is a component that renders the `title` element on the server, and hydrates it on the client.

<div class="text-lg>

```tsx twoslash
import { Title } from "solid-start";
// ---cut---
<Title>My Site</Title>
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Setting the title for your site

```tsx twoslash filename="root.tsx" {5}
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

The `Title` tag contains the title for the page that is rendered in the browsers top tab bar. It is a wrapper of the `title` element and is a re-export from `@solidjs/meta`.

### Setting the title for a specific page

These are typically placed in the `Head` element but can also be placed throughout your application code to overwrite the current title. A `Title` lower in the tree will override a parent's title.

Using a `Title` in a route component will only the that title when the user visits this page.

```tsx twoslash filename="src/routes/profile.tsx" {4}
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