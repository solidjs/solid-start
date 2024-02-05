---
section: api
title: GET
order: 99
subsection: Server
active: true
---
# GET
`GET` allows one to create a server function which is accessed via an [HTTP GET request](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET). When this function is called, the arguments are serialized into the url, thus allowing the use of [HTTP cache-control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) headers.

## Usage
Example with streaming promise and a 60 second cache life

```tsx twoslash {4, 8}
import { json } from "@solidjs/router";
import { GET } from "@solidjs/start";

const hello = GET(async (name: string) => {
  "use server";
  return json(
    { hello: new Promise<string>(r => setTimeout(() => r(name), 1000)) },
    { headers: { "cache-control": "max-age=60" } }
  );
});
```