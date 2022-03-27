<title>src/entry-server.tsx</title>

- [Usage](#usage)
- [Reference](#reference)
  - [`<StartServer>`](#hello-world)

SolidStart uses src/entry-server.tsx to generate the HTTP response when rendering on the server.

```ts {4}
src/
├── routes/
├── root.tsx
├── entry-client.tsx
└── entry-server.tsx
```

---

## Usage

SolidStart uses src/entry-server.tsx to generate the HTTP response when rendering on the server. The default export of this module is a function that lets you create the response, including HTTP status, headers, and HTML, giving you full control over the way the markup is generated and sent to the client.

This module should render the markup for the current page using a `<RemixServer>` element with the context and url for the current request. This markup will (optionally) be re-hydrated once JavaScript loads in the browser using the browser entry module.

You can also export an optional handleDataRequest function that will allow you to modify the response of a data request. These are the requests that do not render HTML, but rather return the loader and action data to the browser once client side hydration has occurred.

Here's a basic example:

```tsx twoslash
import { createHandler, renderAsync, StartServer } from "solid-start/entry-server";
import { inlineServerModules } from "solid-start/server";

export default createHandler(
  inlineServerModules,
  renderAsync(context => <StartServer context={context} />)
);
```
