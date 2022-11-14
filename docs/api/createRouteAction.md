---
section: api
title: createRouteAction
order: 1
subsection: Actions
active: true
---

# createRouteAction

##### `createRouteAction` creates a controller for dispatching and managing the submission state of an async user action.

<div class="text-lg">

```tsx twoslash
import { createRouteAction } from 'solid-start';

async function enrollInClass() {
}
// ---cut---
const [enrolling, enroll] = createRouteAction(enrollInClass);
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Run an async process when a user clicks a button

While you might think this should be just a straight forward `onClick` handler, there are a few things to consider.  You would want to show indicators of the action being performed. You would want to handle errors. You may also want to handle multiple submissions. Let's see how `createRouteAction` helps you deal with some of these issues.

### Run a mutation

If you are coming from [tanstack-query](https://tanstack.com/query/v4), this hook is similar to `useMutation`. It allows you to run an async function and manage the state of the action. It also allows you to run the action multiple times.

### Show a pending indicator for an action in progress

We want to show a pending status while the action is being performed. The submission has a `pending` property that we can use to show a pending indicator.

```twoslash include lib
async function enrollInClass(className: string): Promise<string> {
  return className;
}

async function getClasses() {
  return [
    { name: 'Defense against the Dark Arts' },
    { name: 'Potions' },
    { name: 'Transfiguration' },
  ]
}
```

```tsx twoslash {10,14-16}
// @include: lib
// ---cut---
import { createRouteAction } from 'solid-start';
import { Show } from 'solid-js';

function EnrollmentPage() {
  const [enrolling, enroll] = createRouteAction(enrollInClass);
  return (
    <div>
      <button
        onClick={() => enroll('Defense against the Dark Arts')}
        disabled={enrolling.pending}
      >
        Enroll
      </button>
      <Show when={enrolling.pending}>
        <div>Enrolling...</div>
      </Show>
    </div>
  );
}
```

### Handle errors

If an error occurs, the submission will have an `error` property. We can use this to show an error message.

```tsx twoslash {17-20} filename="routes/enrollment.tsx"

async function enrollInClass(className: string): Promise<void> {
  throw new Error('You are not allowed to enroll in this class')
}
// ---cut---
import { createRouteAction } from 'solid-start';
import { Show } from 'solid-js';

export default function EnrollmentPage() {
  const [enrolling, enroll] = createRouteAction(enrollInClass);
  return (
    <div>
      <button  
        onClick={() => enroll('Defense against the Dark Arts')}
        disabled={enrolling.pending}
      >
        Enroll
      </button>
      <Show when={enrolling.pending}>
        <div>Enrolling...</div>
      </Show>
      <Show when={enrolling.error}>
        <div>{enrolling.error.message}</div>
        <button onClick={() => enrolling.retry()}>Retry</button>
      </Show>
    </div>
  );
}
```

### Showing a success message

If you want to show a success message after an action is complete, you can use the `result` property to get the returned value of the action. 

```tsx twoslash {17-19} filename="routes/enrollment.tsx"
// @include: lib
// ---cut---
import { createRouteAction, createRouteData } from 'solid-start';
import { Show, For } from 'solid-js';

export function EnrollmentPage() {
  const [enrolling, enroll] = createRouteAction(enrollInClass);
  return (
    <div>
      <button
        onClick={() => enroll('Defense against the Dark Arts')}
        disabled={enrolling.pending}
      >
        Enroll
      </button>
      <Show when={enrolling.pending}>
        <div>Enrolling...</div>
      </Show>
      <Show when={enrolling.result}>
        <div>Successfully enrolled in {enrolling.result}</div>
      </Show>
    </div>
  );
}
```

### Refetching data after an action

You don't have to do anything more to have your `createRouteData` functions refetch data after an action.  The `createRouteData` functions will automatically refetch data after an action is performed. 

### Invalidating specific data after an action

If you don't want to refetch all the data, you can use the `invalidate` param to specify which `key`'s to invalidate. This way you only refetch what you know has changed.

```tsx twoslash {5,8} filename="routes/enrollment.tsx"
// @include: lib
// ---cut---
import { createRouteAction, createRouteData } from 'solid-start';
import { Show, For } from 'solid-js';

export default function EnrollmentPage() {
  const classes = createRouteData(getClasses, { key: 'classes' });
  const [enrolling, enroll] = createRouteAction(
    enrollInClass, 
    { invalidate: ['classes'] }
  );

  return (
    <div>
      <ul>
        <For each={classes()}>
          {course => <li>{course.name}</li>}  
        </For>
      </ul>
      <button  
        onClick={() => enroll('Defense against the Dark Arts')}
        disabled={enrolling.pending}
      >
        Enroll
      </button>
      <Show when={enrolling.pending}>
        <div>Enrolling...</div>
      </Show>
      <Show when={enrolling.error}>
        <div>{enrolling.error.message}</div>
      </Show>
    </div>
  );
}
```

### Optimistic UI

Now, since we have Javascript in our hands, we can give the user a more enhanced experience. Sometimes this means pretending an action was successful to provide a more response user experience. This is called an optimistic UI. We can do this in a neat way where you don't need to manage extra state. You have access to the `input` on the submission, so you know what data was sent to the action.

Using the `pending` property, you can use the `input` as part of the visible UI. For example, in a list of enrolled classes, you can add the class to the list before the action is complete. Then, if the action fails, you can remove the class from the list. 

```tsx twoslash {19-21} filename="routes/enrollment.tsx"
// @include: lib
// ---cut---
import { createRouteAction, createRouteData } from 'solid-start';
import { Show, For } from 'solid-js';

export function EnrollmentPage() {
  const classes = createRouteData(getClasses, { key: 'classes' });
  const [enrolling, enroll] = createRouteAction(
    enrollInClass, 
    { invalidate: ['classes'] }
  );

  return (
    <div>
      <div>
        Enrolled Classes
        <ul>
          <For each={classes()}>
            {course => <li>{course.name}</li>}  
          </For>
          <Show when={enrolling.pending}>
            <li>{enrolling.input}</li>
          </Show>
        </ul>
      </div>
      <button  
        onClick={() => enroll('Defense against the Dark Arts')}
        disabled={enrolling.pending}
      >
        Enroll
      </button>
      <Show when={enrolling.pending}>
        <div>Enrolling...</div>
      </Show>
      <Show when={enrolling.error}>
        <div>{enrolling.error.message}</div>
      </Show>
    </div>
  );
}
```


## Reference

### `createRouteAction(action, options)`

Call `createRouteAction` inside a component to create an action controller.

```tsx twoslash
// @include: lib
// ---cut---
import { createRouteAction } from 'solid-start';

function Component() {
  const [enrolling, enroll] = createRouteAction(enrollInClass);
}
```

`createRouteAction` is a hook that returns a tuple of two values: The first item is a reactive object maintaining the state of the submission of the action, along with some helpers. The second item in the tuple is a function used to dispatch the action. 

The second item also has another property called `Form` which is a progressively enhanced version of the `form` element. It is a component that can be used to submit the action, and a `url` can be passed to be the `action` of the `form` element when JS is not available.

#### Returns

`enrolling` is a `Submission` with the following properties:
- `pending` - A boolean indicating if the action is currently being performed.
- `error` - An error object if the action failed.
- `input` - The input that was passed to the action.
- `result` - The data returned from the action.
- And the following methods:
  - `retry()` - Resets the submission with the same input.
  - `clear()` - Clears the state of the submission.

`enroll` is a function that takes the input to the action and dispatches the action. It returns a promise that resolves to the result of the action.

This is the behavior of the `enroll` function:

<img src="/actions-machine.png" />
