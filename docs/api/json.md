---
section: api
title: json
order: 8
subsection: Server
---

# json

##### `json` is a helper function to send JSON HTTP `Response`s

<div class="text-lg">

```tsx twoslash
import { json } from "solid-start";
// ---cut---
const response = json({ hello: "world" });
```

</div>

<table-of-contents></table-of-contents>

## Usage

`json` is a helper function to send JSON HTTP `Response`s. It is a wrapper around `new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } })`. It is useful for sending JSON responses from API Routes.