---
section: api
title: useSearchParams
order: 8
subsection: Router
active: true
---

# useSearchParams

##### `useSearchParams` gives you a read/write pair for the search params in the current location.

<div class="text-lg">

```ts twoslash
import { useSearchParams } from "solid-start";
// ---cut---
const [searchParams, setSearchParams] = useSearchParams();
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Rendering based on search params

Search params can be a powerful way of controlling the UI. For example, you can use them to control the sorting of a list of items, or to filter the items based on some criteria. What does this enable? You can share that URL and the other person will be able to see the same UI as you without configuring anything themselves.

It also enables you to use the browser's back/forward buttons to navigate between different states of the UI. To read the current `URLSearchParams`, call `useSearchParams()` inside a component. The first item in the tuple with be a reactive object with the search params from the current location. You can access them in a listening scope to react to changes.

For example, they can be used in the JSX to customize the UI.

```tsx twoslash {5,11}
function FilteredList(props: any) {
  return <></>
}

type Student = {};

// ---cut---
import { Resource } from 'solid-js';
import { useSearchParams, useRouteData } from "solid-start";

export default function Page() {
  const [searchParams] = useSearchParams();
  const data = useRouteData<() => Resource<Student[]>>();
  return (
    <div>
      <FilteredList
        data={data()}
        filter={searchParams.filter}
      />
    </div>
  );
}
```

### Fetching data based on search params

Similar to customizing the UI based on search params, you can also use them to fetch specific data from the server. Imagine a search page. You would want to persist the searched query in the query. if the user comes to the search page with a search param, you can directly show those results. 

So, you need the search param as a source for your resources. You can use `useSearchParams` to get the search params and use them just like you would any other store value.

```tsx twoslash {5,9} filename="routes/search.tsx"
type Student = {};
const hogwarts = { async search(query: string): Promise<Student[]> { return [] } };

// ---cut---
import { useSearchParams } from "solid-start";
import { createServerData$ } from "solid-start/server";

export function routeData() {
  const [searchParams] = useSearchParams();
  return createServerData$(async (query) => {
    return hogwarts.search(query)
  }, { 
    key: () => searchParams.query
  })
}
```

### Updating search params from the UI

Now, what's the point of a search page without the ability to change the search query. So let's add a search box to the page. We can use the `setSearchParams` function to update the search params. All the instances of `useSearchParams` will be updated with the new search params. Your data will refetch and the UI will update.

```tsx twoslash {4,9} filename="routes/search.tsx"
import { useSearchParams } from "solid-start";

export default function SearchBox() {
  const [searchParams, setSearchParams] = useSearchParams();
  return (
    <div>
      <input
        type="text"
        onInput={(e) => setSearchParams({ query: e.currentTarget.value })}
      />
    </div>
  );
}
```
