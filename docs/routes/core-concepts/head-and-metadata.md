---
section: core-concepts
title: Head and metadata
order: 2
active: true
---

# Head and metadata

<table-of-contents></table-of-contents>

Normally when we are building UIs for our apps, we are dealing with DOM elements that are going to be rendered in the `body` of the `document`. But there are cases where we want to customize what's going to be rendered in the `head` of the `document`. Start doesn't come with a metadata library so we will use `@solidjs/meta` in these examples.

The common elements used in the `head` are:

- [`title`][nativetitle]: Specifies the title of the page, used by the browser tab and headings of search results.
- [`meta`][nativemeta]: Specifies a variety of metadata about the page specified by `name`, ranging from favicon, character set to OG tags for SEO.
- [`link`][nativelink]: Adds assets like stylesheets or scripts for the browser to load for the page.
- [`style`][nativestyle]: Adds inline styles to the page.

### Inside a Route component

These tags will be applied for that specific route only and are removed from `document.head` once a user navigates away from the page. You can use `routeData` here to create titles and SEO metadata that is specific to the dynamic parts of the route.

```tsx {0,5}
import { Title } from "@solidjs/meta";

export default function About() {
  return (
    <>
      <Title>About</Title>
      <h1>About</h1>
    </>
  );
}
```

<aside title="Order of precedence of head tags" type="advanced">
  For `Title` and `Meta` tags with the same name as one mounted higher up in the tree, the instance
  that is lower in the tree takes precedence. This means that the `Title` component used inside a
  Route component will override the `Title` component used in the `Head` component. If you go to a
  route without a `Title` component, the `Head` component's `Title` component will be used.
</aside>

## Adding a site-suffix in Title

You can create custom components that wrap `Title` to add a site-specific prefix to all the titles, e.g.

```tsx
export default function MySiteTitle(props) {
  return <Title>{props.children} | My Site</Title>;
}
```

```tsx {0,5}
import MySiteTitle from "~/components/MySiteTitle";

export default function About() {
  return (
    <>
      <MySiteTitle>About</MySiteTitle>
      <h1>About</h1>
    </>
  );
}
```

## Using async data in `Title`

You can use resources to create titles that are specific to the dynamic parts of the route. For example, if you have a route that looks like `/users/:id`, you can use `routeData` to get the `id` and fetch the user's name from the server. Then you can use that name in the `Title` component.

```tsx {0,5} twoslash
let fetchUser = (id: string) => ({ name: "Harry Potter" });
// ---cut---
import { Title } from "@solidjs/meta";
import { RouteSectionProps } from "@solidjs/router";
import { createResource, Show } from "solid-js";

export default function User(props: RouteSectionProps) {
  const [user] = createResource(() => fetchUser(props.params.id));

  return (
    <Show when={user()}>
      <Title>{user()?.name}</Title>
      <h1>{user()?.name}</h1>
    </Show>
  );
}
```

Similarly, you can use other information to build up other OG tags for SEO.

## Adding SEO tags

For SEO tags like `og:title`, `og:description`, `og:image`, `twitter:title`, `twitter:description`, `twitter:image`, you can use the [`Meta`][meta] component. For tags that you want to apply to all the routes, you should add them inside `Head` in your `root.tsx` file:

```tsx {9-33}
import { Suspense } from "solid-js";
import {
  ...
} from "@solidjs/start";

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Meta
          name="twitter:image:src"
          content="https://opengraph.githubassets.com/a062ab265117a44e5479396add57906d85de72b4dd278127be810c33e00768cf/solidjs/solid-docs-next"
        />
        <Meta name="twitter:site" content="@github" />
        <Meta name="twitter:card" content="summary_large_image" />
        <Meta
          name="twitter:title"
          content="solid-docs-next/md.tsx at tutorial-revision · solidjs/solid-docs-next"
        />
        <Meta
          name="twitter:description"
          content="Solid Docs, rehauled. Very much in progress. Contribute to solidjs/solid-docs-next development by creating an account on GitHub."
        />
        <Meta
          property="og:image"
          content="https://opengraph.githubassets.com/a062ab265117a44e5479396add57906d85de72b4dd278127be810c33e00768cf/solidjs/solid-docs-next"
        />
        <Meta
          property="og:image:alt"
          content="Solid Docs, rehauled. Very much in progress. Contribute to solidjs/solid-docs-next development by creating an account on GitHub."
        />
        <Meta property="og:image:width" content="1200" />
        <Meta property="og:image:height" content="600" />
        <Meta property="og:site_name" content="GitHub" />
      </Head>
    </Html>
  );
}
```

You can add tags with route specific information inside your route files. Just like with the `Title`, `Meta` tags used inside a Route component will override the `Meta` tags used in the `Head` component.

```tsx {6-14}
import MySiteTitle from "~/components/MySiteTitle";

export default function About() {
  return (
    <>
      <MySiteTitle>About</MySiteTitle>
      <Meta name="description" content="Hacker News Clone built with Solid" />
      <Meta
        property="og:title"
        content="solid-docs-next/md.tsx at tutorial-revision · solidjs/solid-docs-next"
      />
      <Meta
        property="og:description"
        content="Solid Docs, rehauled. Very much in progress. Contribute to solidjs/solid-docs-next development by creating an account on GitHub."
      />
      <h1>About</h1>
    </>
  );
}
```

[nativelink]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
[nativestyle]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style
[nativemeta]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta
[nativetitle]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title
[nativehead]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head
