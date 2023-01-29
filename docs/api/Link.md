---
section: api
title: Link
order: 5
subsection: Document
active: true
---

# Link

##### `Link` is a component that renders a `<link>` element in the document's `<head>`.

<div class="text-lg">

```tsx twoslash
import { Link } from "solid-start";
// ---cut---
<Link rel="icon" href="/favicon.ico" />
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Adding a favicon

You should always have a nice favicon for your app, you can add one by using the `<Link>` pointing to your asset.

```tsx twoslash
import { Html, Head, Link } from "solid-start";

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Link rel="icon" href="/favicon.ico" />
      </Head>
    </Html>
  );
}
```


### Using an emoji as a favicon

Or, here's a neat trick. You can use an emoji as your favicon:

```tsx twoslash
import { Html, Head, Link } from "solid-start";

let emojiSvg = (emoji: string) => {
  return `data:image/svg+xml` +
    `<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`
};

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Link 
          rel="icon" 
          href={emojiSvg("🎯")}
        />
      </Head>
    </Html>
  );
}
```

### Adding links from routes

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

## Reference

### `<Link />`

The `Link` component specifies a relationship between the page and an external resource. Most commonly used for things like stylesheets, but it can handle a number of different associations. It is a wrapper of the `link` element and is a re-export from `@solidjs/meta`.
