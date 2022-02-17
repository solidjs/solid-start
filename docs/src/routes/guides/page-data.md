# Page Data

- Data for a given page is put into a file with the same path as the page except instead of `.tsx` it has `.data.tsx`. (or, js, ts, etc)
- the data file is exported to have a default export of a RouteDataFunc
- to use data in a page, you can use the `useRouteData` hook from `solid-app-router`

## Example

```tsx
import { createResource } from "solid-js";
import { RouteDataFunc } from "solid-app-router";
import fetchAPI from "../../lib/api";
import server from "solid-start/server";

const StoryData: RouteDataFunc = props => {
  const [story] = createResource(() => `item/${props.params.id}`, server(fetchAPI));
  return story;
};

export default StoryData;
```