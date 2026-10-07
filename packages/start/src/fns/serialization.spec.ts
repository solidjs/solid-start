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

/** Frames one serialized node the way `serializeToJSONStream` does. */
function frame(node: unknown) {
  const data = JSON.stringify(node);
  const size = new TextEncoder().encode(data).length.toString(16).padStart(8, "0");
  return `;0x${size};${data}`;
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

/** The first frame of a JSON stream that never completes on its own. */
async function firstFrame(value: unknown) {
  const { serializeToJSONStream } = await loadSerialization(true);
  const reader = serializeToJSONStream(value).getReader();
  const { value: chunk } = await reader.read();
  await reader.cancel();
  return new TextDecoder().decode(chunk);
}

describe("values waiting on a later frame", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects a promise that is still pending when the body ends", async () => {
    const { deserializeJSONStream } = await loadSerialization(true);

    const [arg] = (await deserializeJSONStream(new Response(frame(PENDING_PROMISE_ARGS)))) as [
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
    let outcome: Awaited<ReturnType<typeof settleWithin>> | undefined;

    const unhandled = await collectUnhandledRejections(async () => {
      const [arg] = (await deserializeJSONStream(
        new Response(frame(PENDING_PROMISE_ARGS) + ";0xZZZZZZZZ;junk"),
      )) as [Promise<unknown>];
      outcome = await settleWithin(arg);
    });

    expect(unhandled).toEqual([]);
    expect(outcome?.status).toBe("rejected");
    expect((outcome as { reason: Error }).reason.message).toBe("Malformed server function stream.");
  });

  it("does not report a pending promise nobody awaits once the body ends", async () => {
    const { deserializeJSONStream } = await loadSerialization(true);

    const unhandled = await collectUnhandledRejections(async () => {
      await deserializeJSONStream(new Response(frame(PENDING_PROMISE_ARGS)));
    });

    expect(unhandled).toEqual([]);
  });

  it("does not report a decoded rejected promise nobody awaits", async () => {
    const { deserializeJSONStream } = await loadSerialization(true);
    const rejectedArgs = { t: 9, i: 0, a: [{ t: 12, i: 1, s: 0, f: { t: 1, s: "nope" } }], o: 0 };
    let arg: Promise<unknown> | undefined;

    const unhandled = await collectUnhandledRejections(async () => {
      [arg] = (await deserializeJSONStream(new Response(frame(rejectedArgs)))) as [
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
    delete (globalThis as any).self;
    delete (globalThis as any).$R;
  });

  async function firstJSFrame(id: string, value: unknown) {
    const { serializeToJSStream } = await loadSerialization(true);
    const reader = serializeToJSStream(id, value).getReader();
    const { value: chunk } = await reader.read();
    await reader.cancel();
    return new TextDecoder().decode(chunk);
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
    expect((globalThis as any).$R["server-fn:1"]).toBeUndefined();
  });
});
