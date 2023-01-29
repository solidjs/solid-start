---
section: api
title: createServerAction$
order: 2
subsection: Actions
active: true
---

# createServerAction$

##### `createServerAction$` creates a controller for managing the submissions of an async user action, where the action always runs on the server.

<div class="text-lg">

```tsx twoslash
import { createServerAction$ } from "solid-start/server";
// ---cut---
const [acting, act] = createServerAction$(async args => {
  // do something
});
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Creating a Progressively Enhanced Form

One of the benefits of running actions only on the server is we can create progressively enhanced forms that work when JavaScript is disabled or unavailable. To accomplish this we need to pass information to our backend using form elements like `<input>`. Any data need to be sent that end users don't enter can be added with an `<input>` with `type="hidden"`.

```tsx twoslash
const prisma = {
  enrollment: {
    create(arg: { data: { userId: number; subject: string } }) {}
  }
};
function getLoggedInUser(request: Request) {
  return { id: 1 };
}
// ---cut---
import { createServerAction$, redirect } from "solid-start/server";

function EnrollmentPage() {
  const [enrolling, { Form }] = createServerAction$(async (form: FormData, { request }) => {
    const subject = form.get("subject") as string;
    const user = await getLoggedInUser(request);
    await prisma.enrollment.create({
      data: {
        userId: user.id,
        subject
      }
    });
    return redirect("/enrollment");
  });
  return (
    <Form>
      <input type="hidden" name="subject" value="Defense against the Dark Arts" />
      <button type="submit" disabled={enrolling.pending}>
        Enroll
      </button>
    </Form>
  );
}
```

We return a `redirect` to tell the browser where to go upon successful submission. This is important as if this request came in without JavaScript available it would need to do a full page navigation. When JavaScript is enabled we simply invalidate all route data or the key specified by the action that spawned the `<Form />`.

## Reference

Refer to [createRouteAction](./createRouteAction) for API reference.