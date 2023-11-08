---
section: api
title: ErrorBoundary
order: 9
subsection: Document
active: true
---

# ErrorBoundary

##### `ErrorBoundary` is a component that catches errors in its children and renders a fallback UI.

<div class="text-lg">

```tsx twoslash
import { ErrorBoundary } from "solid-start";
// ---cut---
<ErrorBoundary fallback={(e) => <div>{e.message}</div>}>
  <div>...</div>
</ErrorBoundary>
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Catching errors in a tree

The achilles heel of web apps seems to lie in error handling. An unhandled error in one component can bring your entire app down with it. Preferably, apps can be split into self-contained sections so the failure of one component does not render the entire app unusable, only that one section.

Solid achieves this functionality with _Error Boundaries_. `ErrorBoundary` is a special component that ensures the unhandled errors of its children don't extend beyond its boundary.

```tsx twoslash 
function ComponentThatMightError() {
  return null;
}
// ---cut---
import { ErrorBoundary } from "solid-start/error-boundary";

function Component() {
  return (
    <>
      <ErrorBoundary>
        <ComponentThatMightError />
      </ErrorBoundary>
      <p>But this text is still here!</p>
    </>
  );
}
```

### Rendering a fallback UI when an error is caught

While a simple `<ErrorBoundary />` component is enough to contain errors, you may notice that the error is very technical and could be a bit much for your users. You can provide a `fallback` prop to replace the default stack trace with your own code.

Your fallback function takes a single parameter (the cause of the error, typically some derivative of the [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#instance_properties) object), and returns an element.

```tsx twoslash {8-14}
function ComponentThatMightError() {
  return null;
}
// ---cut---
import { ErrorBoundary } from "solid-start/error-boundary";

function Component() {
  return (
    <ErrorBoundary
      fallback={(e: Error) => (
        <>
          <h2>Oh no! An Error!</h2>
          <details>
            <summary>Click here to learn more</summary>
            <p>
              <strong>{e.name}</strong>: {e.message}
            </p>
          </details>
        </>
      )}
    >
      <ComponentThatMightError />
    </ErrorBoundary>
  );
}
```
