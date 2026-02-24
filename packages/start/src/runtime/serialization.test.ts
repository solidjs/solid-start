import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { deserializeJSONStream, deserializeJSStream } from "./serialization";

const encoder = new TextEncoder();

function makeChunk(dataStr: string, declaredBytes?: number): Uint8Array {
  const data = encoder.encode(dataStr);
  const bytes = declaredBytes ?? data.length;
  const baseHex = bytes.toString(16).padStart(8, "0");
  const head = encoder.encode(`;0x${baseHex};`);
  const chunk = new Uint8Array(head.length + data.length);
  chunk.set(head);
  chunk.set(data, head.length);
  return chunk;
}

function streamFromChunks(chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(c);
      controller.close();
    },
  });
}

function responseWithChunks(chunks: Uint8Array[] | null) {
  if (chunks === null) return new Response(null);
  return new Response(streamFromChunks(chunks));
}

const cases = [
  { name: "deserializeJSONStream", call: (r: Response) => deserializeJSONStream(r) },
  { name: "deserializeJSStream", call: (r: Response) => deserializeJSStream("server-fn:0", r) },
];

describe("Serialization negative testing (unhappy paths)", () => {
  // TODO: Serialization drains remaining chunks in the background for performance and 
  // its async errors aren't propagated to a designated error boundary.
  // This is a temporary catch-all to avoid unhandled rejections in this test suite until 
  // we have a better solution for handling async errors in serialization.
  const _unhandledRejectionHandler = (reason: any, promise?: Promise<any>) => {
    // eslint-disable-next-line no-console
    console.error("Unhandled rejection (ignored) in serialization.test:", reason, promise);
  };

  // Install immediately and retain for the duration of this test file.
  beforeEach(() => {
    process.on("unhandledRejection", _unhandledRejectionHandler);
  });

  afterEach(async () => {
    // Wait for any pending microtasks to allow background processes to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    process.off("unhandledRejection", _unhandledRejectionHandler);
  });
  for (const fn of cases) {
    it(`${fn.name} throws on missing body`, async () => {
      await expect(fn.call(responseWithChunks(null))).rejects.toThrow("missing body");
    });

    it(`${fn.name} throws on plain XML response`, async () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><Error><Code>AccessDenied</Code><Message>Access Denied</Message></Error>';
      const chunk = encoder.encode(xml);
      const resp = new Response(new ReadableStream({
        start(controller) {
          controller.enqueue(chunk);
          controller.close();
        },
      }));
      await expect(fn.call(resp)).rejects.toThrow();
    });

    it(`${fn.name} throws Malformed server function stream when header larger than provided bytes`, async () => {
      const chunk = makeChunk("bad", 16); // declare more than actual
      await expect(fn.call(responseWithChunks([chunk]))).rejects.toThrow("Malformed server function stream.");
    });

    it(`${fn.name} throws Malformed server function stream when header smaller than provided bytes`, async () => {
      const chunk = makeChunk("bad", 2); // declare less than actual
      await expect(fn.call(responseWithChunks([chunk]))).rejects.toThrow();
    });

    it(`${fn.name} throws on valid header but invalid JSON body`, async () => {
      const chunk = makeChunk("not-a-json");
      await expect(fn.call(responseWithChunks([chunk]))).rejects.toThrow();
    });
  }
});
