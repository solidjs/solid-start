import crypto from "crypto";
import Streams from "stream/web";
import { fetch, Headers, Request, Response } from "undici";

Object.assign(globalThis, Streams, {
  Request,
  Response,
  fetch,
  Headers
});

if (globalThis.crypto != crypto.webcrypto) {
  // @ts-ignore
  globalThis.crypto = crypto.webcrypto;
}
