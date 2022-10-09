---
section: api
title: createServerData$
order: 8
subsection: Data
---

# createServerData$

##### `createServerData$` gives you a reactive object describing the URL the user is visiting

<div class="text-lg">

```tsx twoslash
import { createServerData$ } from 'solid-start/server'
function getStudents() {
  return [];
}
// ---cut---
const data = createServerData$(getStudents)
```

</div>

<table-of-contents></table-of-contents>

## Usage


## Reference

### `createServerData$(fetcher, options)`



#### Returns

