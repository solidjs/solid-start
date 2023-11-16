---
section: api
title: entry-client.tsx
order: 8
subsection: Entrypoints
active: true
---

# entry-client.tsx

##### `entry-client.tsx` is where your app starts in the browser.

<div class="text-lg">

```tsx twoslash
import { mount, StartClient } from "solid-start/entry-client";

mount(() => <StartClient />, document);
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Mounting your application

This file does one thing. It starts your SolidStart application in the browser. It does so by passing in our `<StartClient>` to a `mount` function that also takes our mount element as an argument. What is `mount`? It is an alias over Solid's `hydrate` and `render` methods to ensure that no matter what the client always starts up properly.

It doesn't matter if you are using SolidStart to do client-only rendering or if you are using our various modes of server-side rendering. This file is good place to run any other client specific code that you want to happen on startup. Things like registering service workers.

## Reference

### `mount(codeFn, mountEl)`

Method that either calls `render` or `hydrate` depending on the configuration.

```tsx twoslash
import { mount, StartClient } from "solid-start/entry-client";

mount(() => <StartClient />, document);
```

#### Parameters

- `codeFn` (_function_): function that executes the application code
- `mountEl` (_Node_ | _Document_): element to mount the application to

### `<StartClient />`

Component that wraps our application root. It includes Context providers for Routing and MetaData.
