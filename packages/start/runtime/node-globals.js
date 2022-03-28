import Streams from "web-streams-polyfill/dist/ponyfill.es2018.js";

import { fetch, Headers, Response, Request } from "undici";

Object.assign(globalThis, Streams, {
  Request,
  Response,
  fetch,
  Headers
});
