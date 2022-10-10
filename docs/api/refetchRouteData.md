---
section: api
title: refetchRouteData
order: 8
subsection: Data
active: true
---

# refetchRouteData

##### `refetchRouteData` allows you to refetch your route data

<div class="text-lg">

```tsx twoslash
import { refetchRouteData } from 'solid-start'
// ---cut---
refetchRouteData()
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Refetching all current route data

Route data is most commonly invalidated and refetched when we perform route actions. However, sometimes we wish to refetch the data manually. The easiest way is execute `refetchRouteData` with no arguments.

```tsx twoslash
import { refetchRouteData } from 'solid-start'

// reload all the data
refetchRouteData()
```

### Refetching specific route data

Additionally `refetchRouteData` accept a `key` as an argument to refetch specific route data. These keys can be strings, or arrays containing strings and objects. Keys will be compared with partial matched making it easier refetcn anmer of rote data resources.

```tsx twoslash
import { refetchRouteData } from 'solid-start'

// reload all route data with users in the key
refetchRouteData(["users"]);

// reload route data for route data with a key of user 123
refetchRouteData(["users", { id: 123 }]);
```


## Reference

### `refetchRouteData(keys)`


Call `retchRouteData()` to refetch route data.

```tsx twoslash
import { refetchRouteData } from "solid-start";

// refetch all
retchRouteData();

// refetch route data for user 123
retchRouteData(["users", { id: 123 }]);

// refetch route data pertaining to users
retchRouteData(["users"]);
```