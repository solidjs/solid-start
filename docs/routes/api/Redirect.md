---
section: api
title: Redirect
order: 12
subsection: Document
active: true
---

# Redirect

##### `Redirect` is a component that redirects the user while server-side rendering.

<div class="text-lg">

```tsx twoslash
import { Redirect } from "@solidjs/start";
// ---cut---
<Redirect to="/" />;
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Using permanent redirects

```tsx twoslash
import { Redirect } from "@solidjs/start";
// ---cut---
<Redirect to="/some-other-page" permanent />;
```

`Redirect` defaults to a temporary redirect (HTTP status code 307), but can be made permanent, sending a 308 status instead.

### Redirecting to start page on 404

```tsx twoslash filename="routes/*404.tsx"
import { Redirect } from "@solidjs/start";

export default function NotFound() {
  return <Redirect to="/" />;
}
```

A custom 404 page may not be necessary for every website, in that case a simple redirect to the start page can implemented using `Redirect`.
