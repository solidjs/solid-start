---
section: advanced
title: Server Runtime
order: 100
---

# Server Runtime API

SolidStart provides a server runtime API that allows you to write code that runs on the server. You don't have to worry about setting up the server itself. SolidStart takes care of that. Your job is to write the handler that is called when a request comes in.

The handler is a function that takes a [FetchEvent][fetchevent] object and returns a [Response][response] object. These APIs are part of the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). The [FetchEvent] API is borrowed from the [Service Worker API][serviceworker]. 

The idea is that you learn these APIs once and get a much larger bang for the buck by being able to use that knowledge across the stack to orchestrate your application. Let's see what the mental model created by these APIs is.

Imagine a fetch client:

```js
fetch('https://example.com')
  .then(response => response.text())
  .then(text => console.log(text))
```

Actually, lets use some async/await to make this cleaner:

```js
const response = await fetch('https://example.com')
const text = await response.text()
console.log(text)
```

When you call `fetch` with a `string`, the `string` is used to create a URL Object. You can also use a [`Request`][request] object as a parameter.

```js
const request = new Request('https://example.com')
fetch(request)
  .then(response => response.text())
  .then(text => console.log(text))
```

Which can be expanded to something like this:

```js
const request = new Request('https://example.com')
const response: Response = await fetch(request)
const text: string = await response.text()
console.log(text)
```

[request]: https://developer.mozilla.org/en-US/docs/Web/API/Request
[response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[fetchevent]: https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent
[serviceworker]: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
