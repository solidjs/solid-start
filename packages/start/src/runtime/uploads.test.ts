import { createApp, toWebHandler } from "vinxi/http";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { serializeToJSONString } from "./serialization";
import {
  ARGS_PART,
  createUploadSerializer,
  FILE_PART,
  readUploadArgs,
  UPLOAD_HEADER
} from "./uploads";

const serverFn = vi.hoisted(() => ({
  args: [] as unknown[]
}));

vi.mock("solidstart:server-fn-manifest", () => ({
  default: {
    fn: {
      functionName: "fn",
      importer: async () => ({
        fn: (...args: unknown[]) => {
          serverFn.args = args;
          return "done";
        }
      })
    }
  }
}));
vi.mock("../server/handler", () => ({ getExpectedRedirectStatus: () => 302 }));
vi.mock("../server/pageEvent", () => ({ createPageEvent: async () => {} }));

const { default: serverHandler } = await import("./server-handler");
const { createServerReference } = await import("./server-runtime");
const handle = toWebHandler(createApp().use(serverHandler));

let sent: Request | undefined;

beforeEach(() => {
  serverFn.args = [];
  sent = undefined;
  vi.stubEnv("SERVER_BASE_URL", "http://localhost:3000");
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    sent = new Request(url, init);
    return handle(sent.clone());
  });
});

/** Calls the server function through the client, and returns what it received. */
async function roundTrip(...args: unknown[]) {
  const fn = createServerReference(() => {}, "fn", "fn") as unknown as (
    ...args: unknown[]
  ) => Promise<unknown>;
  expect(await fn(...args)).toBe("done");
  return serverFn.args;
}

describe("server function uploads", () => {
  it("sends a file as the only argument", async () => {
    const [received] = await roundTrip(new File(["hello"], "hello.txt", { type: "text/plain" }));

    expect(sent!.headers.get(UPLOAD_HEADER)).toBe("true");
    expect(received).toBeInstanceOf(File);
    expect((received as File).name).toBe("hello.txt");
    expect((received as File).type).toBe("text/plain");
    expect(await (received as File).text()).toBe("hello");
  });

  it("sends files next to other arguments and inside them", async () => {
    const file = new File(["a"], "a.txt");
    const form = new FormData();
    form.set("avatar", new File(["png"], "avatar.png"));

    const [first, meta, received] = await roundTrip(
      file,
      { tags: ["x"], list: [new Blob(["b"])], map: new Map([["c", new File(["c"], "c.txt")]]) },
      form
    );

    expect(await (first as File).text()).toBe("a");
    const value = meta as { tags: string[]; list: Blob[]; map: Map<string, File> };
    expect(value.tags).toEqual(["x"]);
    expect(await value.list[0]!.text()).toBe("b");
    expect(await value.map.get("c")!.text()).toBe("c");
    expect(await ((received as FormData).get("avatar") as File).text()).toBe("png");
  });

  it("sends a file used twice once, and keeps it the same value", async () => {
    const file = new File(["once"], "once.txt");

    const [first, second] = await roundTrip(file, { again: file });

    const form = await sent!.clone().formData();
    expect(form.has(`${FILE_PART}0`)).toBe(true);
    expect(form.has(`${FILE_PART}1`)).toBe(false);
    expect((second as { again: File }).again).toBe(first);
  });

  it("copies a blob from another frame", async () => {
    const source = new Blob(["other"], { type: "text/plain" });
    // Not an instance of this realm's Blob, as one from another frame isn't.
    const foreign = {
      size: source.size,
      type: source.type,
      arrayBuffer: () => source.arrayBuffer(),
      slice: () => source.slice()
    };

    const [received] = await roundTrip(foreign, 1);

    expect(await (received as Blob).text()).toBe("other");
  });

  it("keeps calls without files as serialized text", async () => {
    const [value, count] = await roundTrip({ a: 1 }, 2);

    expect(sent!.headers.get("x-serialized")).toBe("true");
    expect(sent!.headers.get(UPLOAD_HEADER)).toBeNull();
    expect(value).toEqual({ a: 1 });
    expect(count).toBe(2);
  });

  it("rejects an upload whose part is missing", async () => {
    const form = new FormData();
    form.set(
      ARGS_PART,
      await serializeToJSONString([new File(["x"], "x.txt")], [createUploadSerializer([])])
    );

    await expect(readUploadArgs(form)).rejects.toThrow();
  });

  it("rejects an upload without its arguments", async () => {
    const form = new FormData();
    form.set(`${FILE_PART}0`, new File(["x"], "x.txt"));

    await expect(readUploadArgs(form)).rejects.toThrow("Malformed server function upload.");
  });

  it("does not read upload indexes from a body that is not multipart", async () => {
    const { deserializeFromJSONString } = await import("./serialization");
    const body = await serializeToJSONString(
      [new File(["x"], "x.txt")],
      [createUploadSerializer([])]
    );

    // A plain body is read without the upload plugin, so the index has no meaning there.
    await expect(deserializeFromJSONString(body)).rejects.toThrow();
  });
});
