---
section: api
title: server$
order: 100
subsection: Server
active: true
---

# server$

Perform actions on the server environment only (i.e. console logging, etc.).

<div class="text-lg">

```tsx twoslash
import server$ from '"@solidjs/start/server"'
// ---cut---
const logHello = server$(async (message: string) => {
  console.log(message)
})
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Basic usage

To create a function that only runs on the server, pass a function as a parameter to `server$`.

```tsx twoslash {4-6}
import server$ from '"@solidjs/start/server"'

function YourComponent() {
  const logHello = server$(async (message: string) => {
    console.log(message)
  });

  logHello('Hello')
}
```

In this example, regardless of whether we are rendering this component on the server or in the browser, the `logHello` function generates a log on the server console only. How does it work? We use compilation to transform the `server$` function into an RPC call to the server.

### Create Fetcher

To create `fetch` based call, pass in the route path as the first parameter, then a boolean of whether the resource is orginated from the server or client.

```tsx twoslash {4} filename="Log.tsx[client]"
import server$ from '"@solidjs/start/server"'

// COMPILATION OUTPUT on the client
const isServerResource = true
const serverFunction1 = server$.createFetcher('/Log.tsx/logHello', isServerResource)

function Component() {
  const logHello = serverFunction1;

  logHello('Hello')
}
```

On the server, we hoist the function to the top-level scope and register it as a handler. If `logHello` is called on the server, it will execute the function directly.

### Register handler

```tsx twoslash {6-11} filename="Log.tsx[server]"
import server$ from '"@solidjs/start/server"'

const isServerResource = true

// COMPILATION OUTPUT on the server
server$.registerHandler(
  '/Log.tsx/logHello',
  async (message: string) => {
    console.log(message)
  }
)
const serverFunction1 = server$.createHandler('/Log.tsx/logHello', '#', isServerResource)

function Component() {
  const logHello = serverFunction1;

  logHello('Hello')
}
```

*Note server$ do not work when application is configured to `ssr: false`*
