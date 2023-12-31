---
section: api
title: use server
order: 100
subsection: Server
active: true
---

# "use server"

Perform actions on the server environment only (i.e. console logging, etc.).

<div class="text-lg">

```tsx twoslash
// ---cut---
const logHello = async (message: string) => {
  "use server";
  console.log(message);
};
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Basic usage

To create a function that only runs on the server, insert `"use server"` directive at the top of the function.

```tsx twoslash {2}
const logHello = async (message: string) => {
  "use server";
  console.log(message);
};

logHello("Hello");
```

In this example, regardless of whether we are rendering this on the server or in the browser, the `logHello` function generates a log on the server console only. How does it work? We use compilation to transform the `use server` function into an RPC call to the server.

### Serialization

Server functions allow the serialization of many different data types in the response. The full list is available [here](https://github.com/lxsmnsyc/seroval/blob/main/docs/compatibility.md#supported-types).

### Meta information

Depending on your hosting, the server function might be running in parallel on multiple cpu cores or workers. You can use `getServerFunctionMeta` to retrieve a function-specific `id`, which is stable across all instances. 

Keep in mind: this `id` can and will change between builds!

```tsx twoslash
import { getServerFunctionMeta } from "@solidjs/start/server";

// or some in-memory db
const appCache: any = globalThis;

const counter = async () => {
  "use server";
  const { id } = getServerFunctionMeta()!;
  const key = `counter_${id}`;
  appCache[key] = appCache[key] ?? 0;
  appCache[key]++;

  return appCache[key] as number;
};
```
