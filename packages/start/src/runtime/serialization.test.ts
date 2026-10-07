import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  deserializeFromJSONString,
  deserializeJSONStream,
  deserializeJSStream,
  serializeToJSONString,
} from "./serialization";

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

const roundTrip = async <T>(value: T) =>
  (await deserializeFromJSONString(await serializeToJSONString(value))) as T;

const ENDED = "Server function stream ended unexpectedly.";

/** Fails the test instead of hanging when a decoded value never settles. */
const settleWithin = <T>(promise: Promise<T>, ms = 200) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("still pending")), ms),
    ),
  ]);

async function readAll<T>(stream: ReadableStream<T>) {
  const reader = stream.getReader();
  const chunks: T[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) return chunks;
    chunks.push(value);
  }
}

// PromiseSuccess, PromiseFailure, StreamThrow, StreamReturn
const SETTLING_NODES = new Set([23, 24, 33, 34]);

/** Drops the nodes that settle promises and end streams, as if the body was cut short. */
function withoutSettlingNodes(json: string) {
  return JSON.stringify(JSON.parse(json), (_key, value) =>
    Array.isArray(value)
      ? value.filter(node => !(node && SETTLING_NODES.has(node.t)))
      : value,
  );
}

describe("deserializeFromJSONString", () => {
  describe("round-trips argument payloads", () => {
    it("plain values, collections and shared references", async () => {
      const shared = { x: 1 };
      const cyclic: Record<string, unknown> = { name: "cyclic" };
      cyclic.self = cyclic;
      const [value] = await roundTrip([
        {
          string: "text",
          number: 1.5,
          bigint: 10n,
          nan: NaN,
          negativeZero: -0,
          infinity: -Infinity,
          nil: null,
          undef: undefined,
          bool: true,
          date: new Date(0),
          map: new Map([["k", shared]]),
          set: new Set([1, 2]),
          array: [shared, shared],
          bytes: new Uint8Array([1, 2, 3]),
          cyclic,
        },
      ]);
      expect(value.string).toBe("text");
      expect(value.number).toBe(1.5);
      expect(value.bigint).toBe(10n);
      expect(value.nan).toBeNaN();
      expect(Object.is(value.negativeZero, -0)).toBe(true);
      expect(value.infinity).toBe(-Infinity);
      expect(value.nil).toBeNull();
      expect("undef" in value && value.undef === undefined).toBe(true);
      expect(value.bool).toBe(true);
      expect(value.date).toEqual(new Date(0));
      expect(value.map.get("k")).toEqual({ x: 1 });
      expect([...value.set]).toEqual([1, 2]);
      expect(value.array[0]).toBe(value.array[1]);
      expect(value.map.get("k")).toBe(value.array[0]);
      expect([...value.bytes]).toEqual([1, 2, 3]);
      expect(value.cyclic.self).toBe(value.cyclic);
    });

    it("resolved and rejected promises", async () => {
      const [resolved, rejected] = await roundTrip([
        Promise.resolve(42),
        Promise.reject(new TypeError("boom")),
      ]);
      await expect(resolved).resolves.toBe(42);
      await expect(rejected).rejects.toThrow(TypeError);
      await expect(rejected).rejects.toThrow("boom");
    });

    it("errors", async () => {
      const [error, aggregate] = await roundTrip([
        new RangeError("out of range"),
        new AggregateError([new Error("inner")], "outer"),
      ]);
      expect(error).toBeInstanceOf(RangeError);
      expect(error.message).toBe("out of range");
      expect(aggregate).toBeInstanceOf(AggregateError);
      expect(aggregate.errors[0].message).toBe("inner");
    });

    it("async iterators", async () => {
      async function* numbers() {
        yield 1;
        yield 2;
      }
      const [iterable] = await roundTrip([numbers()]);
      const values: number[] = [];
      for await (const value of iterable) values.push(value);
      expect(values).toEqual([1, 2]);
    });

    it("readable streams", async () => {
      const source = new ReadableStream({
        start(controller) {
          controller.enqueue("a");
          controller.enqueue("b");
          controller.close();
        },
      });
      const [stream] = await roundTrip([source]);
      expect(stream).toBeInstanceOf(ReadableStream);
      expect(await settleWithin(readAll(stream))).toEqual(["a", "b"]);
    });

    it("form data", async () => {
      const form = new FormData();
      form.append("name", "value");
      form.append("name", "second");
      form.append("other", "x");
      const [value] = await roundTrip([form]);
      expect(value).toBeInstanceOf(FormData);
      expect(value.getAll("name")).toEqual(["value", "second"]);
      expect(value.get("other")).toBe("x");
    });

    it("requests and responses", async () => {
      const [request, response] = await roundTrip([
        new Request("http://localhost/path?q=1", {
          method: "POST",
          headers: { "x-test": "1" },
          body: "request body",
        }),
        new Response("response body", { status: 201, headers: { "x-test": "2" } }),
      ]);
      expect(request).toBeInstanceOf(Request);
      expect(request.method).toBe("POST");
      expect(request.url).toBe("http://localhost/path?q=1");
      expect(request.headers.get("x-test")).toBe("1");
      expect(await request.text()).toBe("request body");
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(201);
      expect(response.headers.get("x-test")).toBe("2");
      expect(await response.text()).toBe("response body");
    });

    it("headers, URLs and search params", async () => {
      const [headers, url, params] = await roundTrip([
        new Headers({ a: "1" }),
        new URL("http://localhost/a?b=c"),
        new URLSearchParams("x=1&x=2"),
      ]);
      expect(headers).toBeInstanceOf(Headers);
      expect(headers.get("a")).toBe("1");
      expect(url).toBeInstanceOf(URL);
      expect(url.href).toBe("http://localhost/a?b=c");
      expect(params).toBeInstanceOf(URLSearchParams);
      expect(params.getAll("x")).toEqual(["1", "2"]);
    });

    it("abort signals, events and DOM exceptions", async () => {
      const [signal, event, custom, exception] = await roundTrip([
        AbortSignal.abort("reason"),
        new Event("ping"),
        new CustomEvent("custom", { detail: { a: 1 } }),
        new DOMException("message", "AbortError"),
      ]);
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal.aborted).toBe(true);
      expect(signal.reason).toBe("reason");
      expect(event).toBeInstanceOf(Event);
      expect(event.type).toBe("ping");
      expect(custom).toBeInstanceOf(CustomEvent);
      expect(custom.detail).toEqual({ a: 1 });
      expect(exception).toBeInstanceOf(DOMException);
      expect(exception.name).toBe("AbortError");
    });
  });

  describe("values left pending when the body ends", () => {
    it("rejects a promise that the body never settles", async () => {
      const [promise] = (await deserializeFromJSONString(
        JSON.stringify({ t: { t: 9, i: 0, a: [{ t: 22, i: 1, s: 2 }], o: 0 }, f: 31, m: [] }),
      )) as [Promise<unknown>];
      await expect(settleWithin(promise)).rejects.toThrow(ENDED);
    });

    it("keeps a promise that the body settles", async () => {
      const [promise] = (await deserializeFromJSONString(
        JSON.stringify({
          t: {
            t: 9,
            i: 0,
            a: [
              { t: 22, i: 1, s: 2 },
              { t: 23, i: 2, a: [{ t: 2, s: 1 }, { t: 0, s: 7 }] },
            ],
            o: 0,
          },
          f: 31,
          m: [],
        }),
      )) as [Promise<unknown>];
      await expect(settleWithin(promise)).resolves.toBe(7);
    });

    it("errors a readable stream that the body never ends", async () => {
      const source = new ReadableStream({
        start(controller) {
          controller.enqueue("a");
          controller.close();
        },
      });
      const json = withoutSettlingNodes(await serializeToJSONString([source]));
      const [stream] = (await deserializeFromJSONString(json)) as [ReadableStream<string>];
      // erroring a ReadableStream discards the chunks still queued in it
      await expect(settleWithin(readAll(stream))).rejects.toThrow(ENDED);
    });

    it("errors an async iterator that the body never ends", async () => {
      async function* numbers() {
        yield 1;
      }
      const json = withoutSettlingNodes(await serializeToJSONString([numbers()]));
      const [iterable] = (await deserializeFromJSONString(json)) as [AsyncIterable<number>];
      const values: number[] = [];
      const consume = async () => {
        for await (const value of iterable) values.push(value);
      };
      await expect(settleWithin(consume())).rejects.toThrow(ENDED);
      expect(values).toEqual([1]);
    });

    it("does not report rejections for decoded promises nobody awaits", async () => {
      const unhandled: unknown[] = [];
      const record = (reason: unknown) => unhandled.push(reason);
      process.on("unhandledRejection", record);
      try {
        await deserializeFromJSONString(
          JSON.stringify({ t: { t: 9, i: 0, a: [{ t: 22, i: 1, s: 2 }], o: 0 }, f: 31, m: [] }),
        );
        await roundTrip([Promise.reject(new Error("never awaited"))]);
        await new Promise(resolve => setTimeout(resolve, 10));
      } finally {
        process.off("unhandledRejection", record);
      }
      expect(unhandled).toEqual([]);
    });

    it("throws when a node is malformed", async () => {
      await expect(
        deserializeFromJSONString(
          JSON.stringify({ t: { t: 9, i: 0, a: [{ t: 22, i: 1, s: 2 }, { t: 999 }], o: 0 }, f: 31, m: [] }),
        ),
      ).rejects.toThrow();
    });
  });
});
