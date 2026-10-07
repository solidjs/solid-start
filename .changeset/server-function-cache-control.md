---
"@solidjs/start": patch
---

Send `Cache-Control: no-store` on server function responses by default.

Server function responses, including calls made with GET, carried no `Cache-Control`, so a shared cache configured to store them could serve one caller's result to another. Every response from the server function handler now defaults to `no-store`: results, errors, redirects, no-JS redirects, raw `Response` passthroughs, and the handler's own refusals. A `Cache-Control` the function sets itself, on a returned `Response` or on the event's response headers, replaces the default rather than being combined with it, and a `304` is never given one.
