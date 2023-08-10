import crypto from "crypto";
import Streams from "stream/web";

Object.assign(globalThis, Streams);

if (globalThis.crypto != crypto.webcrypto) {
  // @ts-ignore
  globalThis.crypto = crypto.webcrypto;
}
