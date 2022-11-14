---
section: api
title: createRouteMultiAction
order: 3
subsection: Actions
active: true
---

# createRouteMultiAction

##### `createRouteMultiAction` creates a controller for dispatching and managing multiple simultaneous submissions of an async user action.

<div class="text-lg">

```tsx twoslash
import { createRouteMultiAction } from 'solid-start';

async function sendMessage(message: string) {
}

async function getMessages() {
  return [
    { text: 'Hello' },
    { text: 'How are you?' },
    { text: 'Goodbye' },
  ];
}
// ---cut---
const [sending, send] = createRouteMultiAction(sendMessage);
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Track multiple submissions of an action simultaneously

Imagine a chat application, where the user is furiously typing and entering messages. How would we track this? We can't use `createRouteAction` because it always ignores a previous submission when it gets a new one. `createRouteMultiAction` allows us to track multiple submissions for the same action.

```twoslash include lib
async function getMessages() {
  return [
    { text: 'Hello' },
    { text: 'How are you?' },
    { text: 'Goodbye' },
  ];
}

async function sendMessage(message: string) {
}
```

```tsx twoslash {4,8}
// @include: lib
// ---cut---
import { createRouteMultiAction } from 'solid-start';

function Component() {
  const [sending, send] = createRouteMultiAction(sendMessage);

  return (
    <div>
      <button onClick={() => send('Hello World')}>Send</button>
    </div>
  );
}
```

Here `sending` is an array of all the submissions. Each submission has its `input` and a `pending` property that we can use to show a pending indicator or optimistic UI. Each submission also has its own `error` property that we can use to show an error message. They have their own `retry()` and `clear()` methods as well.

### Refetching data after an action

You don't have to do anything more to have your `createRouteData` functions refetch data after an action.  The `createRouteData` functions will automatically refetch data after an action is performed. 

### Invalidating specific data after an action

If you don't want to refetch all the data, you can use the `invalidate` param to specify which `key`'s to invalidate. This way you only refetch what you know has changed.

### Optimistic UI

Now, since we have Javascript in our hands, we can give the user a more enhanced experience. Sometimes this means pretending an action was successful to provide a more response user experience. This is called an optimistic UI. We can do this in a neat way where you don't need to manage extra state. You have access to the `input` on the submission, so you know what data was sent to the action.

Using the `pending` property, you can use the `input` as part of the visible UI. For example, in a list of enrolled classes, you can add the class to the list before the action is complete. Then, if the action fails, you can remove the class from the list. 

### Show a pending indicator for an action in progress

We want to show a pending status while the action is being performed. The submission has a `pending` property that we can use to show a pending indicator.

```tsx twoslash {17-19}
// @include: lib
// ---cut---
import { createRouteMultiAction, createRouteData } from 'solid-start';
import { For } from 'solid-js';

export default function EnrollmentPage() {
  const messages = createRouteData(getMessages, { key: 'chat' });
  const [sending, send] = createRouteMultiAction(
    sendMessage, 
    { invalidate: ['chat'] }
  );

  return (
    <div>
      <ul>
        <For each={messages()}>
          {msg => <li>{msg.text}</li>}  
        </For>
        <For each={sending}>
          {msg => <li class="pending">{msg.input}</li>} 
        </For> 
      </ul>
      <button onClick={() => send('Hello World')}>Send</button>
    </div>
  );
}
```

### Handle errors

If an error occurs, each submission will have an `error` property. We can use this to show an error message.

```tsx twoslash {21-24} filename="routes/enrollment.tsx"
// @include: lib
// ---cut---
import { createRouteMultiAction, createRouteData } from 'solid-start';
import { For, Show } from 'solid-js';

export default function EnrollmentPage() {
  const messages = createRouteData(getMessages, { key: 'chat' });
  const [sending, send] = createRouteMultiAction(
    sendMessage, 
    { invalidate: ['chat'] }
  );

  return (
    <div>
      <ul>
        <For each={messages()}>
          {msg => <li>{msg.text}</li>}  
        </For>
        <For each={sending}>
          {msg => (
            <li>
              <span class="pending">{msg.input}</span>
              <Show when={msg.error}>
                <span class="error">{msg.error.message}</span>
                <button onClick={() => msg.retry()}>Retry</button>
              </Show>
            </li>
          )} 
        </For> 
      </ul>
      <button onClick={() => send('Hello World')}>Send</button>
    </div>
  );
}
```

## Reference

### `createRouteMultiAction(action, options)`

Call `createRouteMultiAction` inside a component to create an action controller.

```ts twoslash
// @include: lib
// ---cut---
import { createRouteMultiAction } from 'solid-start';

function Component() {
  const [sending, send] = createRouteMultiAction(sendMessage);
}
```

`createRouteMultiAction` is a hook that returns a tuple of two values: The first item is a reactive list maintaining the state of all the in-flight submissions of the action. The second item in the tuple is a function used to dispatch the action.

The second item also has another property called `Form` which is a progressively enhanced version of the `form` element. It is a component that can be used to submit the action, and a `url` can be passed to be the `action` of the `form` element when JS is not available.

#### Returns

`sending` is a reactive list of `Submission`s with the following properties:
- `error` - An error object if the action failed.
- `input` - The input that was passed to the action.
- `result` - The data returned from the action.
- And the following methods:
  - `retry()` - Resets the submission with the same input
  - `clear()` - Clears the state of the submission.

`enroll` is a function that takes the input to the action and dispatches the action. It returns a promise that resolves to the result of the action. This is the behavior of the `enroll` function:

<img src="/actions-machine.png" />
