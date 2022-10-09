---
section: api
title: createRouteData
order: 8
subsection: Data
---

# createRouteData

##### `createRouteData` gives you a reactive object describing the URL the user is visiting

<div class="text-lg">

```tsx twoslash
import { createRouteData } from 'solid-start'
function getStudents() {
  return [];
}
// ---cut---
const data = createRouteData(getStudents)
```

</div>

<table-of-contents></table-of-contents>

## Usage

## Reference

### `createRouteData(fetcher, options)`

#### Returns