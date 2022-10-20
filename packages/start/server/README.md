# Spec

A server function can be used in any module in your app, be it route file, route data file or any other file that is imported by your routes. What is a server function? A server function is a function that can be isomorphically used on the server and client to perform some server-side only action, eg. getting data from your database, authorizing a user, or sending an email.

This is how you would usually create a server function:

```tsx
import server$ from "solid-start/server";

const serverFunction = server$(async (name: string) => {
  // do some server-side stuff
  return {
    message: `Hello ${name}!`
  };
});
```

- Any code inside a server function (including things that only a server function references) is only executed on the server. It is not even included in the client side bundle.
- You can treat the function that it returns as a normal async function and should expect to receieve exactly what you return or throw from the function you pass in. This is incredibly important and is what allows us to use this model on both the server and the client. What this means?

  - If you return a javascript object, the server function will return that object.

  ```tsx
  import server$ from "solid-start/server";

  const serverFunction = server$((name: string) => ({ message: `Hello ${name}` }));

  console.log(message); // "Hello da vinci"
  ```

```tsx
import server$ from "solid-start/server";

const serverFunction = server$(async (name: string) => {
  throw new Error(`Who is ${name}?`);
});

try {
  serverFuncton("da vinci");
} catch (e) {
  console.log(e.message); // "Who is da vinci?"
}
```

```tsx
import server$ from "solid-start/server";

const serverFunction = server$(async (name: string) => {
  return new Error(`Who is ${name}?`);
});

const e = await serverFuncton("da vinci");
console.log(e.message); // "Who is da vinci?"
```

```tsx
import server$ from "solid-start/server";

const serverFunction = server$(async (name: string) => {
  return new Response(`Hello ${name}`);
});

const e = await serverFuncton("da vinci");
console.log(await e.text()); // "Hello da vinci"
```

- Throwing a Response object will cause the server function to return a Response object that you can catch

  - Redirects are thrown responses
  - Throw a Response instead of returning it if you want to communicate that you want to hit the Error boundary of your app,
    when you dont to continue executing the components in that path. It is similar to indicating that there is an error and you want stop normal execution
  - You can also throw a Response object with a specific status code and headers that will be used as the response status code

  ```tsx
  import server$ from "solid-start/server";

  const serverFunction = server$(async (name: string) => {
    throw new Response(`Hello ${name}`);
  });

  const e = await serverFuncton("da vinci");
  try {
    serverFuncton("da vinci");
  } catch (e) {
    if (e instanceof Response) {
      console.log(await e.text()); // "Hello da vinci"
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
import server$ from "solid-start/server";

export default function Index() {
  const [data] = createResource(server$(() => db.post.findMany()));

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
import server$ from "solid-start/server";

const $serverFn0 = server$.createHandler(() => db.post.findMany());
server$.registerHandler("/_m/src/routes/index.tsx/0", $serverFn0);

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
import server$ from "solid-start/server";

const $serverFn0 = server$.createFetcher("/_m/src/routes/index.tsx/0");

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
