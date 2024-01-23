---
section: core-concepts
title: Actions
order: 7
---

# Actions

One question you will likely have when developing any sort of app is "how do I communicate new information to my server?". The user did something. What next? Solid Router's answer to this is _actions_.

Actions give you the ability to specify an async action processing function and gives you elegant tools to help you easily manage and track submissions. Actions are isomorphic and generally represent a `POST` request.

Actions are isomorphic. This means that a submission can be handled on the server _or_ the client, whichever is optimal. They represent the server component of an [HTML form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form), and even help you use HTML forms to submit data.

## Creating actions

Let's stop getting ahead of ourselves! First, let's create an action!

```tsx twoslash
import { action, useAction } from "@solidjs/router";

const echo = action(async (message: string) => {
  // Imagine this is a call to fetch
  await new Promise((resolve, reject) => setTimeout(resolve, 1000));
  console.log(message);
});

export function MyComponent() {
  const myEcho = useAction(echo);
}
```

This `echo` action will act as your backend, however you can substitute it for any API, provided you are ok with it running on the client. Typically, route actions are used with some sort of solution like fetch or GraphQL.

These will return either a `Response` such as a redirect (we are not returning anything quite yet!) or any value. If you want to ensure the action only runs on the server for things like databases, you will want to use `"use server"`, introduced below.

Naturally, this action won't do anything quite yet. We still need to call it somewhere! For now, let's call it manually from some component using the submit function returned from `action`.

```tsx twoslash
import { action, useAction } from "@solidjs/router";

const echo = action(async (message: string) => {
  // Imagine this is a call to fetch
  await new Promise((resolve, reject) => setTimeout(resolve, 1000));
  console.log(message);
});

export function MyComponent() {
  const myEcho = useAction(echo);
  myEcho("Hello from solid!");
}
```

You should see `Hello from solid!` back in the console!

### Returning from actions

In many cases, after submitting data the server sends some data back as well. Usually an error message if something failed. Anything returned from your action function can be accessed using the reactive `action.result` property. The value of this property can change each time you submit your action.

```tsx twoslash
import { action, useAction, useSubmission } from "@solidjs/router";

const echo = action(async (message: string) => {
  await new Promise((resolve, reject) => setTimeout(resolve, 1000));
  return message;
});

export function MyComponent() {
  const myEcho = useAction(echo);
  const echoing = useSubmission(echo);
  myEcho("Hello from solid!");
  setTimeout(() => myEcho("This is a second submission!"), 1500);
  return <p>{echoing.result}</p>;
}
```

While this method of using actions works, it leaves the implementation details of how you trigger `echo` up to you. When handling explicit user input, it's better to use a `form` for a multitude of reasons.

## Using forms to submit data

We highly recommend using HTML forms as your method to submit data with actions. HTML forms can be used even before JavaScript loads, leading to instantly interactive applications.

They have the added benefit of implicit accessibility. They can save you valuable time that would have otherwise been spent designing a UI library that will never have the aforementioned benefits.

When forms are used to submit actions, the first argument is an instance of [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData). To write a form using actions, pass the action to the action property of your form. You can then walk away with amazing, progressively enhanced forms!

If you don't return a `Response` from your action, the user will stay on the same page and your resources will be re-triggered. You can also throw a `redirect` to tell the browser to navigate.

```tsx twoslash
import { action, redirect } from "@solidjs/router";

const isAdmin = action(async (formData: FormData) => {
  await new Promise((resolve, reject) => setTimeout(resolve, 1000));
  const username = formData.get("username");
  if (username === "admin") throw redirect("/admin");
  return new Error("Invalid username");
});

export function MyComponent() {
  return (
    <form action={isAdmin} method="post">
      <label for="username">Username:</label>
      <input type="text" name="username" />
      <input type="submit" value="submit" />
    </form>
  );
}
```

## Server Actions

Sometimes we need to make sure our action _only_ runs on the server. This is useful for:

- Accessing internal APIs.
- Proxying external APIs.
  - To use server secrets.
  - To reduce the response payload by postprocessing.
  - To bypass CORS.
- Running code incompatible with browsers.
- Or even connecting directly to a database. (Take caution, opinions on if this is a good idea are mixed. You should consider separating your backend and frontend).

To do this, put a `"use server";` directive in your action function:

```tsx twoslash {4}
import { action, redirect } from "@solidjs/router";

const isAdmin = action(async (formData: FormData) => {
  "use server";
  await new Promise((resolve, reject) => setTimeout(resolve, 1000));
  const username = formData.get("username");
  if (username === "admin") throw redirect("/admin");
  return new Error("Invalid username");
});

export function MyComponent() {
  return (
    <form action={isAdmin} method="post">
      <label for="username">Username:</label>
      <input type="text" name="username" />
      <input type="submit" value="submit" />
    </form>
  );
}
```
