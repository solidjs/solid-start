# Spec

A server function can be used in any module in your app, be it route file, route data file or any other file that is imported by your routes. What is a server function? A server function is a function that can be isomorphically used on the server and client to perform some server-side only action, eg. getting data from your database, authorizing a user, or sending an email.

This is how you would usually create a server function:

```tsx
import server from "solid-start/server";

const serverFunction = server(async (name: string) => {
  // do some server-side stuff
  return {
    message: `Hello ${name}!`
  };
});
```

- Any code inside a server function (including things that only a server function references) is only executed on the server. It is not even included in the client side bundle.
- You can treat the function that it returns as a normal async function and should expect to receieve exactly what you return or throw from the function you pass in. This is incredibly important and is what allows us to use this model on both the server and the client. What this means?
  - If you return/throw a promise, the server function will wait for the promise to resolve before returning the result.

```tsx
import server from "solid-start/server";

const serverFunction = server(async (name: string) => {
  throw new Error("Hello world");
});

try {
  serverFuncton("da vinci");
} catch (e) {
  console.log(e.message); // "Hello world"
}
```

```tsx
import server from "solid-start/server";

const serverFunction = server(async (name: string) => {
  return new Error("Hello world");
});

const e = await serverFuncton("da vinci");
console.log(e.message); // "Hello world"
```

```tsx
import server from "solid-start/server";

const serverFunction = server(async (name: string) => {
  return new Response("Hello world");
});

const e = await serverFuncton("da vinci");
console.log(await e.text()); // "Hello world"
```

```tsx
import server from "solid-start/server";

const serverFunction = server(async (name: string) => {
  throw new Response("Hello world");
});

const e = await serverFuncton("da vinci");
try {
  serverFuncton("da vinci");
} catch (e) {
  if (e instanceof Response) {
    console.log(await e.text()); // "Hello world"
  }
}
```

- If you return/throw an `Error` or its subclass, the server function will return/throw the error with the same stack and custom properties. You can assert the name of the error or the message on the client to detect different kinds of errors.
- If you return/throw a HTTP `Response` (of the `fetch` API), the server function will return the same-looking response on the client.
  - A response can be a redirect too, and we handle this such that when doing client side routing, we still communicate a redirect without using the browser redirect, but sending a redirect response for a page works without javascript. Actually executing the redirect is handled by the client side router or the browser based on the situation
- If you return/throw a plain object, the server function will return the same-looking response on the client.

It is designed to be used when this server side functionality is serving the UI for the app, and not for long running tasks, or webhooks. Lets see an example of a server function that gets a list of blog posts.

```tsx file=src/routes/index.tsx
import db from "~/db";
import server from "solid-start/server";

export default function Index() {
  const [data] = createResource(server(() => db.post.findMany()));

  return (
    <Show when={data()}>
      <For each={data}>
        <div>
          {data.map(post => (
            <div key={post.id}>{post.title}</div>
          ))}
        </div>
      </For>
    </Show>
  );
}
```

We use compilation to make this possible.

```tsx file=src/routes/index.tsx
import db from "~/db";
import server from "solid-start/server";

const $serverFn0 = server.createHandler(() => db.post.findMany());
server.registerHandler("/_m/src/routes/index.tsx/0", $serverFn0);

export default function Index() {
  const [data] = createResource($serverFn0);

  return (
    <Show when={data()}>
      <For each={data}>
        <div>
          {data.map(post => (
            <div key={post.id}>{post.title}</div>
          ))}
        </div>
      </For>
    </Show>
  );
}
```

```tsx file=src/routes/index.tsx
import server from "solid-start/server";

const $serverFn0 = server.createFetcher("/_m/src/routes/index.tsx/0");

export default function Index() {
  const [data] = createResource($serverFn0);

  return (
    <Show when={data()}>
      <For each={data}>
        <div>
          {data.map(post => (
            <div key={post.id}>{post.title}</div>
          ))}
        </div>
      </For>
    </Show>
  );
}
```

Make sure that the module is somehow imported in your server bundle, so that the server registers it.
