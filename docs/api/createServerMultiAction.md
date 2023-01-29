---
section: api
title: createServerMultiAction$
order: 4
subsection: Actions
active: true
---

# createServerMultiAction$

##### `createServerMultiAction$` creates a controller for dispatching and managing multiple simultaneous submissions of an async user action, where the action always runs on the server.

<div class="text-lg">

```tsx twoslash
import { createServerMultiAction$ } from 'solid-start/server'
// ---cut---
const [acting, act] = createServerMultiAction$(async (args) => {
  // do something
})
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Bring Multi Actions to the Server

`createServerMultiAction$` is the `server$` function enhanced version of `createRouteMultiAction`. It has the same API except it always runs on the server.

## Reference

Refer to [createRouteMultiAction](./createRouteMultiAction) for API reference.

