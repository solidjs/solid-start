import crypto from "crypto";
import Streams from "stream/web";

// Bun does not support this assignment.
// We only assign globalThis if the runtime
// is not Bun.
//
// https://bun.sh/guides/util/detect-bun
if (!process.versions.bun) {
  Object.assign(globalThis, Streams);
}

if (globalThis.crypto != crypto.webcrypto) {
  // @ts-ignore
  globalThis.crypto = crypto.webcrypto;
}
