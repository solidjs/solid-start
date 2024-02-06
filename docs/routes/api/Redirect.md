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

`Redirect` defaults to a temporary redirect (HTTP status code 307), but can be made permanent, sending a 308 status instead:

```tsx twoslash
import { Redirect } from "@solidjs/start";
// ---cut---
<Redirect to="/" permanent />;
```
