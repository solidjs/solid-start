---
section: api
title: refetchRouteData
order: 8
subsection: Data
active: true
---

# refetchRouteData

##### `refetchRouteData` allows you to refetch your route data.

<div class="text-lg">

```tsx twoslash
import { refetchRouteData } from 'solid-start';
// ---cut---
refetchRouteData()
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Refetching all current route data

Route data is most commonly invalidated and refetched when we perform route actions. However, sometimes we wish to refetch the data manually. The easiest way is to execute `refetchRouteData` with no arguments.

```tsx twoslash
import { refetchRouteData } from 'solid-start';

// refetch all the resources created with createRouteData
refetchRouteData()
```

### Refetching specific route data

Additionally `refetchRouteData` accept a `key` as an argument to refetch specific route data. These keys can be strings, or arrays containing strings and objects. Keys will be compared with partial matching, making it easier to refetch groups of route data resources at once.

```tsx twoslash {14,18}
function fetchStudents() {}
// ---cut---
import { refetchRouteData, createRouteData } from 'solid-start';

const allStudents = createRouteData(
  fetchStudents, 
  { key: ['students'] }
);

const gryffindorStudents = createRouteData(
  fetchStudents, 
  { key: ['students', { house: 'gryffindor' }] 
});

// reload all route data with students in the key, 
refetchRouteData(['students']);
// refetches both allStudents and gryffindorStudents

// reload route data for route data with a key of house gryffindor
refetchRouteData(['students', { house: 'gryffindor' }]);
// refetches gryffindorStudents only
```

## Reference

### `refetchRouteData(keys)`

Call `retchRouteData()` to refetch either all the route data on the page, or specific ones based on the `key`.

```tsx twoslash
import { refetchRouteData } from "solid-start";

// refetch all
refetchRouteData();

// refetch route data for user 123
refetchRouteData(["users", { id: 123 }]);

// refetch route data pertaining to users
refetchRouteData(["users"]);
```
