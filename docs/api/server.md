---
section: api
title: server$
order: 100
subsection: Server
active: true
---

# server$

##### `server$` takes a function that should only run on the server and compiles its usage into an RPC call to the server.

<div class="text-lg">

```tsx twoslash
import server$ from 'solid-start/server'
// ---cut---
const logHello = server$(async (message: string) => {
  console.log(message)
})
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Declare a function that only runs on the server

```tsx twoslash {4-6}
import server$ from 'solid-start/server'

function Component() {
  const logHello = server$(async (message: string) => {
    console.log(message)
  });

  logHello('Hello')
}
```

In this code snippet regardless of whether we are server rendering this component or client rendering it, the `logHello` function generates a log on the server console only. How does it work? We use compilation to transform the `server$` function into an RPC call to the server. 

```tsx twoslash {4} filename="Log.tsx[client]"
import server$ from 'solid-start/server'

// COMPILATION OUTPUT on the client
const serverFunction1 = server$.createFetcher('/Log.tsx/logHello')

function Component() {
  const logHello = serverFunction1;
  
  logHello('Hello')
}
```

On the server, we hoist the function to the top-level scope and register it as a handler. If `logHello` is called on the server, it will execute the function directly.

```tsx twoslash {4-10} filename="Log.tsx[server]"
import server$ from 'solid-start/server'

// COMPILATION OUTPUT on the server
server$.registerHandler(
  '/Log.tsx/logHello', 
  async (message: string) => {
    console.log(message)
  }
)
const serverFunction1 = server$.createHandler('/Log.tsx/logHello', '#')

function Component() {
  const logHello = serverFunction1;

  logHello('Hello')
}
```
