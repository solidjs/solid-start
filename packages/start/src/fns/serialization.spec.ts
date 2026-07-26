import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadSerialization(prod: boolean) {
  vi.stubEnv("PROD", prod as any);
  vi.stubEnv("DEV", !prod as any);
  vi.resetModules();
  return await import("./serialization.ts");
}

async function readStream(stream: ReadableStream<Uint8Array>) {
  return await new Response(stream).text();
}

function createError() {
  function inner() {
    throw new Error("my server error");
  }
  try {
    inner();
    throw new Error("unreachable");
  } catch (error) {
    return error as Error;
  }
}

describe("serialization", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("omits the error stack from the JSON stream in production", async () => {
    const { serializeToJSONStream } = await loadSerialization(true);
    const error = createError();

    const payload = await readStream(serializeToJSONStream(error));

    expect(payload).toContain("my server error");
    expect(payload).not.toContain("stack");
    expect(payload).not.toContain("serialization.spec.ts");
  });

  it("omits the error stack from the JS stream in production", async () => {
    const { serializeToJSStream } = await loadSerialization(true);
    const error = createError();

    const payload = await readStream(serializeToJSStream("server-fn:0", error));

    expect(payload).toContain("my server error");
    expect(payload).not.toContain("serialization.spec.ts");
  });

  it("keeps the error stack in development", async () => {
    const { serializeToJSONStream } = await loadSerialization(false);
    const error = createError();

    const payload = await readStream(serializeToJSONStream(error));

    expect(payload).toContain("my server error");
    expect(payload).toContain("stack");
    expect(payload).toContain("serialization.spec.ts");
  });

  it("round-trips an error carrying a stack even when serialization strips it", async () => {
    const dev = await loadSerialization(false);
    const withStack = await readStream(dev.serializeToJSONStream(createError()));

    const prod = await loadSerialization(true);
    const parsed = (await prod.deserializeFromJSONString(withStack)) as Error;

    expect(parsed).toBeInstanceOf(Error);
    expect(parsed.message).toBe("my server error");
    expect(parsed.stack).toContain("serialization.spec.ts");
  });
});
