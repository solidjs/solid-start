---
section: api
title: clientOnly
order: 99
subsection: Server
active: true
---

# "clientOnly"

Wrap Components that are only to be rendered in the Client. Helpful for components that can never server render because they interact directly with the DOM. It works similar to `lazy` except it only renders after hydration and never loads on the Server.

<div class="text-lg">

```tsx
import { clientOnly } from "@solidjs/start";

const ClientOnlyComp = clientOnly(() => import("../ClientOnlyComp"));

function IsomorphicComp() {
  return <ClientOnlyComp />;
}
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Basic usage

You may have a component that has some sort of client based side effect like writing or reading something from the document. Maybe some legacy jQuery code etc. To use `clientOnly` first isolate the code in a file.

```tsx twoslash
const location = window.document.location;

export default function ClientOnlyComponent() {
  return <div>{location.href}</div>;
}
```

And then import dynamically using `clientOnly`.

```tsx
import { clientOnly } from "@solidjs/start";

const ClientOnlyComp = clientOnly(() => import("../ClientOnlyComp"));

function IsomorphicComp() {
  return <ClientOnlyComp />;
}
```
