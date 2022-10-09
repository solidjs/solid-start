---
section: api
title: createServerAction$
order: 8
subsection: Actions
---

# createServerAction$

##### `createServerAction$` creates a controller for managing the submissions of an async user action, where the action always runs on the server

<div class="text-lg">

```tsx twoslash
import { createServerAction$ } from 'solid-start/server'
// ---cut---
const [acting, act] = createServerAction$(async (args) => {
  // do something
})
```

</div>

<table-of-contents></table-of-contents>

## Usage

## Reference

### `createServerAction$(action, options)`

#### Returns


