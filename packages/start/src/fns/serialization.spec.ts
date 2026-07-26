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
