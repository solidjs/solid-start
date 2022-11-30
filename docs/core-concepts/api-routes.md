---
section: core-concepts
title: API Routes
order: 8
active: true
---

# API Routes

<table-of-contents></table-of-contents>

While we think that using  [`createServerData$`][createServerData] is the best way to write server-side code for data needed by your UI, sometimes you need to expose API routes. Reasons for wanting API Routes include:

- You have additional clients that want to share this logic.
- You want to expose a GraphQL or tRPC endpoint.
- You want to expose a public facing REST API.
- You need to write webhooks or auth callback handlers for OAuth.
- You want to have URLs not serving HTML, but other kinds of documents like PDFs or images.

SolidStart makes it easy to write routes for these use cases.

## Writing an API Route

API routes are just like any other route and follow the same filename conventions as [UI Routes][routing]. The only difference is in what you should export from the file. API Routes do not export a default Solid component and a `routeData` function.

Instead, they export functions that are named after the HTTP method that they handle. For example, a `GET` request would be handled by the exported `GET` function. If a handler is not defined for a given HTTP method, SolidStart will return a `405 Method Not Allowed` response.

```tsx twoslash filename="routes/api/students.ts"
// handles HTTP GET requests to /api/students
export function GET() {
  return new Response("Hello World");
}

export function POST() {
  // ...
}

export function PATCH() {
  // ...
}

export function DELETE() {
  // ...
}
```

These functions can also sit in your UI routes beside your component. They can handle non-GET HTTP requests for those routes.

```tsx twoslash filename="routes/students.tsx"
export function POST() {
  // ...
}

export function routeData() {
  // ...
}

export default function Students() {
  return <h1>Students</h1>;
}
```

<aside type="warning">
A route can only export either a default UI component or a `GET` handler. You cannot export both.
</aside>

## Implementing an API Route handler

An API route gets passed an `APIEvent` object as its first argument. This object contains:

- `request`: `Request` object representing the request sent by the client.
- `params`: Object that contains the dynamic route parameters, e.g. for `/api/students/:id`, when user requests `/api/students/123` , `params.id` will be `"123"`.
- `env`: Environment context, environment specific settings, and bindings.
- `fetch`: An internal `fetch` function that can be used to make requests to other API routes without worrying about the `origin` of the URL.

An API route is expected to return a [`Response`][response] object. Let's look at an example of an API route that returns a list of students in a given house, in a specific year:

```tsx twoslash filename="routes/api/[house]/students/year-[year].ts"
// @filename: hogwarts.ts
export default {
  getStudents(house: string, year: string) {
    return [
      { name: "Harry Potter", house, year },
      { name: "Hermione Granger", house, year },
      { name: "Ron Weasley", house, year },
    ];
  },
};

// @filename: index.ts
// ---cut---
import { APIEvent, json } from "solid-start/api";
import hogwarts from "./hogwarts";

export async function GET({ params }: APIEvent) {
  console.log(`House: ${params.house}, Year: ${params.year}`);
  const students = await hogwarts.getStudents(params.house, params.year);
  return json({ students });
}
```

## Session management

As HTTP is a stateless protocol, for awesome dynamic experiences, you want to know the state of the session on the client. For example, you want to know who the user is. The secure way of doing this is to use HTTP-only cookies.

You can store session data in them and they are persisted by the browser that your user is using. We expose the `Request` object which represents the user's request. The cookies can be accessed by parsing the `Cookie` header.

Let's look at an example of how to use the cookie to identify the user:

```tsx twoslash filename="routes/api/[house]/admin.ts"
// @filename: hogwarts.ts
export default {
  getStudents(house: string, year: string) {
    return [
      { name: "Harry Potter", house, year },
      { name: "Hermione Granger", house, year },
      { name: "Ron Weasley", house, year },
    ];
  },
  getHouseMaster(house: string) {
    return {
      name: "Severus Snape",
      house,
      id: "5"
    };
  },
};

// @filename: index.ts
// ---cut---
import { APIEvent, json } from "solid-start/api";
import { parseCookie } from "solid-start";
import hogwarts from "./hogwarts";

export async function GET({ request, params }: APIEvent) {
  const cookie = parseCookie(request.headers.get("Cookie") ?? "");
  const userId = cookie['userId'];
  if (!userId) {
    return new Response("Not logged in", { status: 401 });
  }
  const houseMaster = await hogwarts.getHouseMaster(params.house);
  if (houseMaster.id !== userId) {
    return new Response("Not authorized", { status: 403 });
  }
  return json({ 
    students: await hogwarts.getStudents(params.house, params.year) 
  });
}
```

This is a very simple example and quite unsecure, but you can see how you can use cookies to read and store session data. Read the [session][session] documentation for more information on how to use cookies for more secure session management.

You can read more about using HTTP cookies in the [MDN documentation][cookies].

## Exposing a GraphQL API

SolidStart makes it easy to implement a GraphQL API. The `graphql` function takes a GraphQL schema and returns a function that can be used as an API route handler.

- Install the `graphql` library
- Then in any route file you can implement a graphql api like below

```ts twoslash filename="routes/graphql.ts"
import { buildSchema, graphql } from "graphql";
import { json } from "solid-start";
import { APIEvent } from "solid-start";

// Define GraphQL Schema
const schema = buildSchema(`
  type Message {
      message: String
  }

  type Query {
    hello(input: String): Message
    goodbye: String
  }
`);

// Define GraphQL Resolvers
const rootValue = {
    hello: () => {
        return {
            message: "Hello World"
          }
  },
  goodbye: () => {
      return "Goodbye"
  }
};

// request handler
const handler = async (event: APIEvent) => {  

  // get request body
  const body = await new Response(event.request.body).json()

  // pass query and save results
  const result = await graphql({rootValue, schema, source: body.query})

  // send query results as response
  return json(result);
};

export const GET = handler;

export const POST = handler;
```

## Exposing a tRPC Server route

Let's see how to expose a [tRPC][trpc] server route. First you write your router, put it in a separate file so that you can export the type for your client.

```tsx filename="lib/router.ts"
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

export const appRouter = t.router({
  hello: t.procedure.input(z.string().nullish()).query(({ input }) => {
    return `hello ${input ?? 'world'}`;
  }),
});

export type AppRouter = typeof appRouter;
```

Here is a simple client that you can use in your `routeData` function to fetch data from your [tRPC][trpc] server. You can also use the proxy in `createServerData$` and `createServerAction$` functions, but it's usually better to just use it in a `createResource` or `createRouteData` function.

```tsx filename="lib/trpc.ts"
import {
  createTRPCProxyClient,
  httpBatchLink,
  loggerLink,
} from '@trpc/client';
import type { AppRouter } from "./router";

export const client = createTRPCProxyClient<AppRouter>({
  links: [loggerLink(), httpBatchLink({ url: "/api/trpc" })],
});
```

Finally, you can use the `fetch` adapter to write an API route that acts as the tRPC server.

```tsx filename="routes/api/trpc/[...].ts"
import { APIEvent } from "solid-start/api";
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from "~/lib/router";

const handler = (event: APIEvent) => 
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req: event.request,
    router: appRouter,
    createContext: () => ({}),
  });

export const GET = handler;

export const POST = handler;
```

Learn more about [tRPC][trpc] here.

[cookies]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
[session]: /advanced/session
[response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[createServerData]: /api/createServerData
[trpc]: https://trpc.io
[routing]: /core-concepts/routing
