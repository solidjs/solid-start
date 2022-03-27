<title>createForm()</title>

<ssr>

- [Usage](#usage)
  - [Forms with server functions](#example)
    - [With server-side validation](#server-side-form-with-client-side-validation)
    - [With client-side validation](#server-side-form-with-client-side-validation)
    - [With authentication](#server-side-form-with-authentication)
    - [With third-party form library](#server-side-form-with-third-party-form-library)
    - [With GET request](#server-side-form-with-get-request)
  - [Forms with API routes](#api-routes)

</ssr>

<spa>

- [Usage](#usage)
  - [Forms with external API](#client-side-forms)

</spa>

- [Reference](#reference)

  - [`createForm(action): FormController`](#hello-world)
  - [`FormController`](#form-controller)
    - [`<FormController.Form>`](#form-controller-form)
    - [`FormController.submissions()`](#form-controller-form)
    - [`FormController.submission(key: string)`](#form-controller-form)

- [Troublehooting](#troublehooting)

```ts twoslash
import { createForm } from "solid-start/form";
import server from "solid-start/server";

const newItem = createForm(server(formData => {}));
```

```ts twoslash
import { createForm } from "solid-start/form";

const newItem = createForm({
  action: formData => {
    console.log(formData);
  }
});
```

---

## Usage

### Forms with server functions (`SSR`)

Server functions are incredibly powerful and can be used to implement the backend for your forms as well. If this is the first you are hearing of Server functions, I would suggest quickly reading how those work.

Create a [`FormController`](/api/) by passing a server function to `createForm`. For a server function to be used as the action handler for a form, it must have the following signature:

- It should accept a single parameter of type [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData). It contains the data submitted by the user.
- If a form submission is successful, it should return a redirect [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) to the page that the user should go to. It can be the same page that the user came from.
- If the form submission fails, it should throw a [`FormError`](/api/forms/formerror) which describes the reason the submission failed, and the fields that caused the failure.

```twoslash include main
// @lib: ES2015
export function postMessage({ message }: { message: string; }) {
  return;
};
import { createForm, FormError } from "solid-start/form";
import server, { redirect } from "solid-start/server";
import Filter from 'bad-words';
const filter = new Filter();
```

```twoslash include postMessageForm
const postMessageForm = createForm(
  server(async function (formData: FormData) {
    const message = formData.get("message") as string;
    await postMessage({ message });
    return redirect("/");
  })
);
```

```twoslash include loginComponent
export default function MessageInput() {
  return (
    <postMessageForm.Form>
      <input name="message" />
      <button type="submit">
        Send
      </button>
    </postMessageForm.Form>
  );
}
```

```tsx twoslash {2,5}
// @include: main
// ---cut---
// @include: postMessageForm
```

Let's create a form that has inputs for email and password. This form uses the [`FormController`]() we created above.

```tsx twoslash
// @include: main
// @include: postMessageForm
// ---cut---
// @include: loginComponent
```

#### With server-side validation

Before we execute the logic to handle the form submission, we should check the user's submission for any invalid fields. We want to do this on the server itself, so we can be sure that nobody is using our APIs from outside the web client. We can do this inside the `server function`.

Let's add a check for the message being atleast 10 characters long.

```tsx twoslash {4-10}
// @include: main
// ---cut---
const postMessageForm = createForm(
  server(async function (formData: FormData) {
    const message = formData.get("message") as string;
    if (message.length < 10) {
      throw new FormError("Invalid fields", {
        fieldErrors: {
          message: "Must be longer than 10 characters."
        }
      });
    }
    await postMessage({ message });
    return redirect("/");
  })
);
```

We can also add a check for the message not containing any bad language.

```tsx twoslash {1-7}
// @include: main
const postMessageForm = createForm(
  server(async function (formData: FormData) {
    const message = formData.get("message") as string;
    if (message.length < 10) {
      throw new FormError("Invalid fields", {
        fieldErrors: {
          message: "Must be longer than 10 characters."
        }
      });
      // ---cut---
    } else if (filter.isProfane(message)) {
      throw new FormError("Invalid fields", {
        fieldErrors: {
          message: "Cannot contain foul language."
        }
      });
    }
    await postMessage({ message });
    return redirect("/");
  })
);
```

#### With client-side validation

#### With authentication

We don't want to allow anyone to create a new item without logging in. Let's add a [`FormController`]() to our login form.

#### With third party form library

#### With GET request

There are some cases where you might want your form to be submitted with a GET request. For example, if you have a search bar, your form submission does not change the state of the server/database, but instead returns a new page with the results. This is similar to clicking a link, but the user does not leave the page.

### Forms with API routes (`SSR`)

### Forms with external API (`SSR` `SPA`)

---

## Reference

### `createForm(action)`
