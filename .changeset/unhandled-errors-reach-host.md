---
"@solidjs/start": patch
---

Let the server hosting the app answer and report an error that an API route or middleware throws, or that a server function request hits before the function runs. The handler answered it inside its own h3 app, so its `fetch` never rejected: with Nitro, the `error` hook and the `errorHandler` never ran for it, and SolidStart's own dev server never showed its error overlay. An h3 `HTTPError` not marked unhandled, or a status thrown as a number, is answered as before. A server that calls the handler's `fetch` itself now gets a rejected promise for such an error and answers it; headers set for the error response with `event.res.errHeaders` are not part of that answer.
