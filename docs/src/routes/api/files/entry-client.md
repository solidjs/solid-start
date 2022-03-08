<title>src/entry-client.tsx</title>

- [Usage](#usage)
- [Reference](#reference)
  - [`<StartClient>`](#hello-world)

SolidStart uses `src/entry-client.tsx` as the entry point for the browser bundle.

```ts {3}
src/
├── routes/
├── root.tsx
├── entry-client.tsx
└── entry-server.tsx
```

---

## Usage

<ssr>

When your page is server-side rendered, this module gives you full control over the "hydrate" step after JavaScript loads into the document.

Typically this module uses `hydrate` from `solid-js/web` to re-hydrate the markup that was already generated on the server in your server entry module.

Here's a basic example:

```tsx twoslash
import { hydrate } from "solid-js/web";
import { StartClient } from "solid-start/entry-client";

hydrate(() => <StartClient />, document);
```

</ssr>

<spa>

When your page is server-side rendered, this module gives you full control over the "render" step of your SPA.

Typically this module uses `render` from `solid-js/web` to render your app on the client.

Here's a basic example:

```tsx twoslash
import { render } from "solid-js/web";
import { StartClient } from "solid-start/entry-client";

render(() => <StartClient />, document);
```

</spa>

This is the first piece of code that runs in the browser. As you can see, you have full control here. You can initialize client side libraries, setup things like `window.history.scrollRestoration`, etc.
