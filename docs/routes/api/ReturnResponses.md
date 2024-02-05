---
section: api
title: Returning Responses
order: 99
subsection: Typescript
active: true
---

# Returning Responses

In SolidStart it's possible to return a Response object from a server function. For Typescript ergonomics, when returning a response using `@solidjs/router`'s `redirect`, `reload`, or `json` helpers, they will not impact the return value of the server function. 

## Examples

In the following example, as far as Typescript is concerned, the `hello` function will return a value of type `Promise<{ hello: Promise<string> }>`

```tsx twoslash 
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
<br />

In this next example, because `redirect` and `reload` return `never` that means the `getUser` function can only return a value of type `Promise<User>`

```tsx { 4, 10, 14}
export async function getUser() {
  "use server"

  const session = await getSession();
  const userId = session.data.userId;
  if (userId === undefined) return redirect("/login");

  try {
    const user: User = await db.user.findUnique({ where: { id: userId } });
    
    // throwing here could have been a bit awkward.
    if (!user) return redirect("/login");
    return user;
  } catch {
    // do stuff
    throw redirect("/login");
  }
}
```
