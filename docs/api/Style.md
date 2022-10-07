---
section: api
title: Style
order: 6
subsection: Document
---

# Style

```tsx twoslash
import { Html, Head, Style } from "solid-start";
// ---cut---
export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Style>{`
          p {
            color: #26b72b;
          }
        `}</Style>
      </Head>
    </Html>
  );
}
```

The `Style` component contains css used to style the page. Generally, it is better to put styles in an external stylesheet and use a `Link` instead. It is a wrapper of the `style` element and is a re-export from `@solidjs/meta`. Note styles provided to the `Style` component are not scoped.

`Style` components can not only be added to `Head` but also across your application allowing dynamic addition and removal depending on if currently mounted.

```tsx twoslash
import { Style } from "solid-start";
// ---cut---
export default function MyPage() {
  return (
    <>
      <Style>{`
        p {
          color: #909090;
        }
      `}</Style>
      <h1>My Super Cool Page</h1>
    </>
  );
}
```
