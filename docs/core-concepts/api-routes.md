---
section: core-concepts
title: API Routes
order: 8
active: true
---

# API Routes

<table-of-contents></table-of-contents>

While we think that using [`createServerData$`][createserverdata] is the best way to write server-side code for data needed by your UI, sometimes you need to expose API routes.

These are reasons for wanting API Routes:

- You have additional clients that want to share this logic
- You want to expose a GraphQL or tRPC endpoint
- You want to expose a public facing REST API
- You need to write webhooks or auth callback handlers for OAuth
- You want to have URLs not serving HTML, but other kinds of documents like PDFs or images

SolidStart makes it easy to write routes for these use cases.

## Writing an API Route

API routes are just like any other route and follow the same filename conventions as [UI Routes][routing]. The only difference is in what you should export from the file. Instead of exporting a default Solid component and a `routeData` function, API Routes export functions that are named after the HTTP method that they handle, e.g. A `GET` request would be handled by the exported `GET` function. If a handler is not defined for a given HTTP method, SolidStart will return a `405 Method Not Allowed` response.

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

These functions can also sit in your UI routes besides your component. They can handle non-GET HTTP requests for those routes.

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

- `request`: the `Request` object representing the request sent by the client
- `params`: object that contains the dynamic route parameters, e.g. for `/api/students/:id`, when user requests `/api/students/123` , `params.id` will be `"123"`
- `env`: the environment context, environment specific settings, bindings
- `fetch`: an internal `fetch` function that can be used to make requests to other API routes without worrying about the `origin` of the URL.

An API route is expected to return a [`Response`][response] object.

Let's look at an example of an API route that returns a list of students in a given house, in a specific year:

```tsx twoslash filename="routes/api/[house]/students/year-[year].ts"
// @filename: hogwarts.ts
export default {
  getStudents(house: string, year: string) {
    return [
      { name: "Harry Potter", house, year },
      { name: "Hermione Granger", house, year },
      { name: "Ron Weasley", house, year }
    ];
  }
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

As HTTP is a stateless protocol, for awesome dynamic experiences, you want to know the state of the session on the client. For example, you want to know who the user is. The secure way of doing this is to use HTTP-only cookies. You can store session data in them and they are persisted by the browser that your user is using.

We expose the `Request` object which represents the user's request. The cookies can be accessed by parsing the `Cookie` header. Let's look at an example of how to use the cookie to identify the user:

```tsx twoslash filename="routes/api/[house]/admin.ts"
// @filename: hogwarts.ts
export default {
  getStudents(house: string, year: string) {
    return [
      { name: "Harry Potter", house, year },
      { name: "Hermione Granger", house, year },
      { name: "Ron Weasley", house, year }
    ];
  },
  getHouseMaster(house: string) {
    return {
      name: "Severus Snape",
      house,
      id: "5"
    };
  }
};

// @filename: index.ts
// ---cut---
import { APIEvent, json } from "solid-start/api";
import { parseCookie } from "solid-start";
import hogwarts from "./hogwarts";

export async function GET({ request, params }: APIEvent) {
  const cookie = parseCookie(request.headers.get("Cookie") ?? "");
  const userId = cookie["userId"];
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

You can read more about using HTTP cookies in the [MDN documentation][cookies]

## Exposing a GraphQL API

SolidStart makes it easy to implement a GraphQL API. The `graphql` function takes a GraphQL schema and returns a function that can be used as an API route handler. TODO: Implementation

```tsx twoslash filename="routes/api/graphql.ts"
import { APIEvent } from "solid-start/api";
const graphql = (schema: string, resolvers: any) => (event: APIEvent) => {
  return new Response("GraphQL Response");
};

const schema = `
  type Query {
    hello: String
  }
`;

const handler = graphql(schema, {
  Query: {
    hello: () => "Hello World"
  }
});

export const GET = handler;

export const POST = handler;
```

## Using tRPC In Solid

First, install the required [tRPC] packages & Zod

```bash
npm install @trpc/server@next @trpc/client@next zod
```

Then, install the required Solid packages

```bash
npm install @tanstack/solid-query solid-trpc@next solid-start-trpc@latest
```

Now, create a simple [tRPC] router:

```tsx filename="src/server/trpc/router.ts"
import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

const appRouter = t.router({
  hello: t.procedure.input(z.object({ name: z.string() })).query(({ input }) => {
    return `Hello ${input.name}`;
  }),
  random: t.procedure.input(z.object({ num: z.number() })).mutation(({ input }) => {
    return Math.floor(Math.random() * 100) / input.num;
  })
});

export type IAppRouter = typeof appRouter;
```

Then, create a tRPC & query client

```tsx filename="src/utils/trpc.ts"
import { QueryClient } from "@tanstack/solid-query";
import { IAppRouter } from "~/server/trpc/router.ts";
import { createTRPCSolid } from "solid-trpc";
import { httpBatchLink } from "@trpc/client";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const trpc = createTRPCSolid<IAppRouter>();
export const client = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`
    })
  ]
});
export const queryClient = new QueryClient();
```

And finally, create the api router

```tsx filename="src/routes/api/trpc/[trpc].ts"
import { createSolidAPIHandler } from "solid-start-trpc";
import { appRouter } from "~/server/trpc/router.ts";

const handler = createSolidAPIHandler({
  router: appRouter,
  createContext: opts => opts
});

export const GET = handler; // queries
export const POST = handler; // mutations
```

Now you can use [tRPC] in your Solid app:

```tsx filename="src/routes/index.tsx"
import { onMount } from "solid-js";
import { trpc } from "~/utils/trpc.ts";

export default function Home() {
  const res = trpc.hello.useQuery({ name: "from tRPC" });
  const mutExample = trpc.random.useMutation();

  onMount(() => {
    mutExample.mutateAsync({ num: 5 }).then(console.log);
  });

  return <div>{res.isLoading ? "loading" : res.data}</div>;
}
```

Learn more about [tRPC][trpc] here.

[cookies]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
[session]: /advanced/session
[response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[createserverdata]: /api/createServerData
[trpc]: https://trpc.io
