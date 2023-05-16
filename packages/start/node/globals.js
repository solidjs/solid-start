if (!globalThis.crypto) {
  const crypto = await import("node:crypto");
  // @ts-ignore
  globalThis.crypto = crypto.webcrypto;
}

if (!globalThis.crypto.subtle) {
  const crypto = await import("node:crypto");
  // @ts-ignore
  globalThis.crypto.subtle = crypto.webcrypto.subtle;
  globalThis.crypto.randomUUID = crypto.webcrypto.randomUUID.bind(crypto.webcrypto);
}

export { };
