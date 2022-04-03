import Streams from "stream/web";
import { fetch, Headers, Response, Request } from "undici";
import crypto from "crypto";

Object.assign(globalThis, Streams, {
  Request,
  Response,
  fetch,
  Headers,
  crypto: crypto.webcrypto
});
