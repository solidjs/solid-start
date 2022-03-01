import Streams from "stream/web";

import { fetch, Headers, Response, Request } from "undici";

Object.assign(globalThis, Streams, {
  Request,
  Response,
  fetch,
  Headers
});
