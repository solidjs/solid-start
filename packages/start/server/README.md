# Spec

A server function can be used in any module in your app, be it route file, route data file or any other file that is imported by your routes. What is a server function? A server function is a function that can be isomorphically used on the server and client to perform some server-side only action, eg. getting data from your database, authorizing a user, or sending an email.

It is designed to be used when this server side functionality is serving the UI for the app, and not for long running tasks, or webhooks. Lets see an example of a server function that gets a list of blog posts.

```tsx file=src/routes/index.tsx
import db from "~/db";

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
