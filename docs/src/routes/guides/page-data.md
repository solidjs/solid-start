# Page Data

- Data for a given page is put into a file with the same path as the page except instead of `.tsx` it has `.data.tsx`. (or, js, ts, etc)
- the data file is exported to have a default export of a RouteDataFunc
- to use data in a page, you can use the `useData` hook from `solid-app-router`