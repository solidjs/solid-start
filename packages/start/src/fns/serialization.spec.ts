import { createPlugin } from "seroval";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadSerialization(prod: boolean) {
  vi.stubEnv("PROD", prod as any);
  vi.stubEnv("DEV", !prod as any);
  vi.resetModules();
  return await import("./serialization.ts");
}

/**
 * Stands in for a value Seroval has no built-in support for, the way a Mongo
 * `ObjectId` or a Prisma `Decimal` would.
 * @see https://github.com/solidjs/solid-start/issues/1474
 */
class Money {
  constructor(readonly cents: number) {}
}

const MoneyPlugin = createPlugin<Money, { cents: any }>({
  tag: "solid-start/test/Money",
  test: value => value instanceof Money,
  parse: {
    sync: (value, ctx) => ({ cents: ctx.parse(value.cents) }),
    async: async (value, ctx) => ({ cents: await ctx.parse(value.cents) }),
    stream: (value, ctx) => ({ cents: ctx.parse(value.cents) }),
  },
  serialize: (node, ctx) => `new Money(${ctx.serialize(node.cents)})`,
  deserialize: (node, ctx) => new Money(ctx.deserialize(node.cents) as number),
});

/** Mirrors what the `solid-start:seroval-plugins` virtual module returns. */
function useUserPlugins(plugins: unknown[]) {
  (globalThis as any).SEROVAL_PLUGINS_STUB = plugins;
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
    delete (globalThis as any).SEROVAL_PLUGINS_STUB;
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

describe("custom seroval plugins", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete (globalThis as any).SEROVAL_PLUGINS_STUB;
  });

  it("throws on an unsupported class when no plugins are configured", async () => {
    useUserPlugins([]);
    const { serializeToJSONString } = await loadSerialization(true);

    await expect(serializeToJSONString([new Money(1999)])).rejects.toThrow();
  });

  it("round-trips a custom class through the JSON payload", async () => {
    useUserPlugins([MoneyPlugin]);
    const { serializeToJSONString, deserializeFromJSONString } = await loadSerialization(true);

    const payload = await serializeToJSONString([new Money(1999)]);
    const [parsed] = (await deserializeFromJSONString(payload)) as [Money];

    expect(parsed).toBeInstanceOf(Money);
    expect(parsed.cents).toBe(1999);
  });

  it("round-trips a custom class nested inside supported containers", async () => {
    useUserPlugins([MoneyPlugin]);
    const { serializeToJSONString, deserializeFromJSONString } = await loadSerialization(true);

    const payload = await serializeToJSONString([
      { total: new Money(500), items: new Map([["a", new Money(250)]]) },
    ]);
    const [parsed] = (await deserializeFromJSONString(payload)) as [
      { total: Money; items: Map<string, Money> },
    ];

    expect(parsed.total).toBeInstanceOf(Money);
    expect(parsed.total.cents).toBe(500);
    expect(parsed.items.get("a")).toBeInstanceOf(Money);
    expect(parsed.items.get("a")!.cents).toBe(250);
  });

  it("preserves referential identity across the payload", async () => {
    useUserPlugins([MoneyPlugin]);
    const { serializeToJSONString, deserializeFromJSONString } = await loadSerialization(true);

    const shared = new Money(42);
    const payload = await serializeToJSONString([{ a: shared, b: shared }]);
    const [parsed] = (await deserializeFromJSONString(payload)) as [{ a: Money; b: Money }];

    expect(parsed.a).toBe(parsed.b);
  });

  it("keeps built-in plugins working alongside a user plugin", async () => {
    useUserPlugins([MoneyPlugin]);
    const { serializeToJSONString, deserializeFromJSONString } = await loadSerialization(true);

    const payload = await serializeToJSONString([
      { url: new URL("https://solidjs.com/docs"), price: new Money(1) },
    ]);
    const [parsed] = (await deserializeFromJSONString(payload)) as [{ url: URL; price: Money }];

    expect(parsed.url).toBeInstanceOf(URL);
    expect(parsed.url.href).toBe("https://solidjs.com/docs");
    expect(parsed.price).toBeInstanceOf(Money);
  });

  it("lets built-in plugins win over a user plugin that claims the same value", async () => {
    const hostile = createPlugin<URL, { href: any }>({
      tag: "solid-start/test/HostileURL",
      test: value => value instanceof URL,
      parse: {
        sync: (value, ctx) => ({ href: ctx.parse("hijacked") }),
        async: async (value, ctx) => ({ href: await ctx.parse("hijacked") }),
        stream: (value, ctx) => ({ href: ctx.parse("hijacked") }),
      },
      serialize: (node, ctx) => ctx.serialize(node.href),
      deserialize: (node, ctx) => ctx.deserialize(node.href) as unknown as URL,
    });
    useUserPlugins([hostile]);
    const { serializeToJSONString, deserializeFromJSONString } = await loadSerialization(true);

    const payload = await serializeToJSONString([new URL("https://solidjs.com/")]);
    const [parsed] = (await deserializeFromJSONString(payload)) as [URL];

    expect(parsed).toBeInstanceOf(URL);
    expect(parsed.href).toBe("https://solidjs.com/");
  });
});

function streamOf(pieces: (string | Uint8Array)[]) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const piece of pieces) {
        controller.enqueue(typeof piece === "string" ? encoder.encode(piece) : piece);
      }
      controller.close();
    },
  });
}

function frame(data: string) {
  const size = new TextEncoder().encode(data).length;
  return `;0x${size.toString(16).padStart(8, "0")};${data}`;
}

/** Splits bytes into pieces of `size`, the way a network read can. */
function split(text: string, size: number) {
  const bytes = new TextEncoder().encode(text);
  const pieces: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += size) {
    pieces.push(bytes.subarray(i, i + size));
  }
  return pieces;
}

/** Frames one serialized node the way `serializeToJSONStream` does. */
function frameNode(node: unknown) {
  return frame(JSON.stringify(node));
}

/** An argument list whose only item is a promise that a later frame was meant to settle. */
const PENDING_PROMISE_ARGS = { t: 9, i: 0, a: [{ t: 22, i: 100, s: 101 }], o: 0 };

const STILL_PENDING = { status: "pending" } as const;

async function settleWithin(value: PromiseLike<unknown>, ms = 100) {
  return await Promise.race([
    Promise.resolve(value).then(
      value => ({ status: "fulfilled", value }) as const,
      reason => ({ status: "rejected", reason }) as const,
    ),
    new Promise<typeof STILL_PENDING>(resolve => setTimeout(() => resolve(STILL_PENDING), ms)),
  ]);
}

/** Runs `run` with the process-level unhandled rejection listeners swapped for a recorder. */
async function collectUnhandledRejections(run: () => Promise<void>) {
  const previous = process.listeners("unhandledRejection");
  process.removeAllListeners("unhandledRejection");
  const reasons: unknown[] = [];
  const record = (reason: unknown) => reasons.push(reason);
  process.on("unhandledRejection", record);
  try {
    await run();
    // Node reports unhandled rejections once the microtask queue has drained.
    await new Promise(resolve => setTimeout(resolve, 20));
  } finally {
    process.off("unhandledRejection", record);
    for (const listener of previous) process.on("unhandledRejection", listener);
  }
  return reasons;
}

/** Reads one whole frame off a serialized stream; its header and data can arrive as separate pieces. */
async function readFirstFrame(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  let bytes = new Uint8Array(0);
  let end = Infinity;
  while (bytes.length < end) {
    const { done, value } = await reader.read();
    if (done) break;
    const joined = new Uint8Array(bytes.length + value.length);
    joined.set(bytes);
    joined.set(value, bytes.length);
    bytes = joined;
    if (end === Infinity && bytes.length >= 12) {
      end = 12 + Number.parseInt(new TextDecoder().decode(bytes.subarray(3, 11)), 16);
    }
  }
  await reader.cancel();
  return new TextDecoder().decode(bytes.subarray(0, end));
}

/** The first frame of a JSON stream that never completes on its own. */
async function firstFrame(value: unknown) {
  const { serializeToJSONStream } = await loadSerialization(true);
  return await readFirstFrame(serializeToJSONStream(value));
}

describe("values waiting on a later frame", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects a promise that is still pending when the body ends", async () => {
    const { deserializeJSONStream } = await loadSerialization(true);

    const [arg] = (await deserializeJSONStream(new Response(frameNode(PENDING_PROMISE_ARGS)))) as [
      Promise<unknown>,
    ];

    expect(arg).toBeInstanceOf(Promise);
    const outcome = await settleWithin(arg);
    expect(outcome.status).toBe("rejected");
    expect((outcome as { reason: Error }).reason.message).toMatch(/ended unexpectedly/);
  });

  it("errors a stream that is still open when the body ends", async () => {
    const body = await firstFrame([new ReadableStream({ start() {} })]);
    const { deserializeJSONStream } = await loadSerialization(true);

    const [arg] = (await deserializeJSONStream(new Response(body))) as [ReadableStream];

    expect(arg).toBeInstanceOf(ReadableStream);
    const outcome = await settleWithin(arg.getReader().read());
    expect(outcome.status).toBe("rejected");
    expect((outcome as { reason: Error }).reason.message).toMatch(/ended unexpectedly/);
  });

  it("rejects pending values with the failure when a later frame is malformed", async () => {
    const { deserializeJSONStream } = await loadSerialization(true);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    let outcome: Awaited<ReturnType<typeof settleWithin>> | undefined;

    const unhandled = await collectUnhandledRejections(async () => {
      const [arg] = (await deserializeJSONStream(
        new Response(frameNode(PENDING_PROMISE_ARGS) + ";0xZZZZZZZZ;junk"),
      )) as [Promise<unknown>];
      outcome = await settleWithin(arg);
    });

    expect(unhandled).toEqual([]);
    expect(outcome?.status).toBe("rejected");
    expect((outcome as { reason: Error }).reason.message).toBe("Malformed server function stream.");
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("server function stream"),
      (outcome as { reason: Error }).reason,
    );
  });

  it("does not report a pending promise nobody awaits once the body ends", async () => {
    const { deserializeJSONStream } = await loadSerialization(true);

    const unhandled = await collectUnhandledRejections(async () => {
      await deserializeJSONStream(new Response(frameNode(PENDING_PROMISE_ARGS)));
    });

    expect(unhandled).toEqual([]);
  });

  it("does not report a decoded rejected promise nobody awaits", async () => {
    const { deserializeJSONStream } = await loadSerialization(true);
    const rejectedArgs = { t: 9, i: 0, a: [{ t: 12, i: 1, s: 0, f: { t: 1, s: "nope" } }], o: 0 };
    let arg: Promise<unknown> | undefined;

    const unhandled = await collectUnhandledRejections(async () => {
      [arg] = (await deserializeJSONStream(new Response(frameNode(rejectedArgs)))) as [
        Promise<unknown>,
      ];
    });

    expect(unhandled).toEqual([]);
    await expect(arg).rejects.toBe("nope");
  });

  it("still resolves a promise settled by a later frame", async () => {
    const { serializeToJSONString, deserializeFromJSONString } = await loadSerialization(true);
    const payload = await serializeToJSONString([
      new Promise(resolve => setTimeout(() => resolve("later"), 5)),
    ]);

    const [arg] = (await deserializeFromJSONString(payload)) as [Promise<unknown>];

    await expect(arg).resolves.toBe("later");
  });

  it("still reads a stream completed by later frames", async () => {
    const { serializeToJSONString, deserializeFromJSONString } = await loadSerialization(true);
    const payload = await serializeToJSONString([
      new ReadableStream({
        start(controller) {
          controller.enqueue("a");
          controller.enqueue("b");
          controller.close();
        },
      }),
    ]);

    const [arg] = (await deserializeFromJSONString(payload)) as [ReadableStream<string>];
    const values: string[] = [];
    for await (const value of arg) values.push(value);

    expect(values).toEqual(["a", "b"]);
  });
});

describe("values waiting on a later JS frame", () => {
  beforeEach(() => {
    vi.resetModules();
    // seroval's JS output addresses its references through `self.$R`
    (globalThis as any).self = globalThis;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    delete (globalThis as any).self;
    delete (globalThis as any).$R;
  });

  async function firstJSFrame(id: string, value: unknown) {
    const { serializeToJSStream } = await loadSerialization(true);
    return await readFirstFrame(serializeToJSStream(id, value));
  }

  it("rejects a promise that is still pending when the body ends", async () => {
    const body = await firstJSFrame("server-fn:0", [new Promise(() => {})]);
    const { deserializeJSStream } = await loadSerialization(true);

    const [arg] = (await deserializeJSStream("server-fn:0", new Response(body))) as [
      Promise<unknown>,
    ];

    const outcome = await settleWithin(arg);
    expect(outcome.status).toBe("rejected");
    expect((outcome as { reason: Error }).reason.message).toMatch(/ended unexpectedly/);
    expect((globalThis as any).$R["server-fn:0"]).toBeUndefined();
  });

  it("errors a stream that is still open when the body ends", async () => {
    const body = await firstJSFrame("server-fn:2", [new ReadableStream({ start() {} })]);
    const { deserializeJSStream } = await loadSerialization(true);

    const [arg] = (await deserializeJSStream("server-fn:2", new Response(body))) as [
      ReadableStream,
    ];

    expect(arg).toBeInstanceOf(ReadableStream);
    const outcome = await settleWithin(arg.getReader().read());
    expect(outcome.status).toBe("rejected");
    expect((outcome as { reason: Error }).reason.message).toMatch(/ended unexpectedly/);
    expect((globalThis as any).$R["server-fn:2"]).toBeUndefined();
  });

  it("rejects pending values with the failure when a later frame is malformed", async () => {
    const body = await firstJSFrame("server-fn:1", [new Promise(() => {})]);
    const { deserializeJSStream } = await loadSerialization(true);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    let outcome: Awaited<ReturnType<typeof settleWithin>> | undefined;

    const unhandled = await collectUnhandledRejections(async () => {
      const [arg] = (await deserializeJSStream(
        "server-fn:1",
        new Response(body + ";0xZZZZZZZZ;junk"),
      )) as [Promise<unknown>];
      outcome = await settleWithin(arg);
    });

    expect(unhandled).toEqual([]);
    expect(outcome?.status).toBe("rejected");
    expect((outcome as { reason: Error }).reason.message).toBe("Malformed server function stream.");
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("server function stream"),
      (outcome as { reason: Error }).reason,
    );
    expect((globalThis as any).$R["server-fn:1"]).toBeUndefined();
  });

  it("releases the scope and cancels the body when the first frame fails", async () => {
    const body = await firstJSFrame("server-fn:3", [new Promise(() => {})]);
    const source = body.slice(12) + ';throw new Error("first frame failed")';
    const { deserializeJSStream } = await loadSerialization(true);
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(frame(source)));
      },
      cancel() {
        cancelled = true;
      },
    });

    await expect(deserializeJSStream("server-fn:3", new Response(stream))).rejects.toThrow(
      "first frame failed",
    );
    expect(cancelled).toBe(true);
    expect((globalThis as any).$R["server-fn:3"]).toBeUndefined();
  });
});

describe("SerovalChunkReader", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("writes a fixed-size header before each chunk", async () => {
    const { serializeToJSONString } = await loadSerialization(true);

    const payload = await serializeToJSONString(1);

    expect(payload).toMatch(/^;0x[0-9a-f]{8};/);
    expect(payload).toBe(frame(payload.slice(12)));
  });

  it("reads chunks split at any byte, including inside a character", async () => {
    const { SerovalChunkReader } = await loadSerialization(true);
    const body = frame("héllo wörld ✓") + frame("") + frame("second");

    const reader = new SerovalChunkReader(streamOf(split(body, 1)));
    const chunks: string[] = [];
    await reader.drain(chunk => chunks.push(chunk));

    expect(chunks).toEqual(["héllo wörld ✓", "", "second"]);
  });

  it("reads a large chunk in small pieces in linear time", async () => {
    const { SerovalChunkReader } = await loadSerialization(true);
    const data = "x".repeat(16 * 1024 * 1024);

    const start = performance.now();
    const result = await new SerovalChunkReader(streamOf(split(frame(data), 16 * 1024))).next();

    expect(result.value).toHaveLength(data.length);
    // Copying the whole buffer on every piece took about 2 seconds here.
    expect(performance.now() - start).toBeLessThan(500);
  });

  it.each([
    ["a missing delimiter", "X0x00000003Yabc"],
    ["a non-hex size", ";0x0000zz03;abc"],
    ["a missing 0x prefix", ";0000000003;abc"],
    ["a truncated header", ";0x0000"],
    ["truncated data", ";0x000000ff;abc"],
  ])("rejects %s", async (_, body) => {
    const { SerovalChunkReader } = await loadSerialization(true);

    await expect(new SerovalChunkReader(streamOf([body])).next()).rejects.toThrow(
      "Malformed server function stream.",
    );
  });

  it("rejects a chunk over the size limit before buffering it", async () => {
    const { SerovalChunkReader } = await loadSerialization(true);
    const reader = new SerovalChunkReader(streamOf([";0xffffffff;"]), { maxChunkSize: 1024 });

    await expect(reader.next()).rejects.toThrow(/larger than the limit/);
  });

  it("reports a bad later chunk instead of leaving an unhandled rejection", async () => {
    const { serializeToJSONString, deserializeJSONStream } = await loadSerialization(true);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const unhandled: unknown[] = [];
    const onUnhandled = (error: unknown) => unhandled.push(error);
    process.on("unhandledRejection", onUnhandled);

    try {
      const first = await serializeToJSONString([1, 2]);
      const value = await deserializeJSONStream(new Response(first + frame("{nope")));
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(value).toEqual([1, 2]);
      expect(unhandled).toEqual([]);
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining("server function stream"),
        expect.any(SyntaxError),
      );
    } finally {
      process.off("unhandledRejection", onUnhandled);
    }
  });

  it("cancels the body when the first chunk cannot be parsed", async () => {
    const { deserializeJSONStream } = await loadSerialization(true);
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(frame("{nope")));
      },
      cancel() {
        cancelled = true;
      },
    });

    await expect(deserializeJSONStream(new Response(body))).rejects.toThrow(SyntaxError);
    expect(cancelled).toBe(true);
  });
});
