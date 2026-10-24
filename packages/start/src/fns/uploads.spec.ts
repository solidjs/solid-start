import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deserializeFromJSONString, serializeToJSONString } from "./serialization.ts";
import { BODY_FORMAT_KEY, BodyFormat, extractBody } from "./shared.ts";
import { ARGS_PART, createUploadSerializer, FILE_PART } from "./uploads.ts";

vi.mock("../shared/dev-toolbar/functions/tracker.ts", () => ({
  pushRequest: vi.fn(),
  pushResponse: vi.fn(),
}));

const { cloneServerReference } = await import("./client.ts");

let sent: Request | undefined;

beforeEach(() => {
  sent = undefined;
  vi.stubEnv("SERVER_BASE_URL", "http://localhost/");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (request: Request) => {
      sent = request;
      return new Response(null, { status: 204 });
    }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

/** Calls a server function and returns the arguments the server reads from the request. */
async function roundTrip(...args: unknown[]) {
  await (cloneServerReference("upload-fn") as unknown as (...args: unknown[]) => Promise<unknown>)(
    ...args,
  );
  return (await extractBody("", false, sent!)) as unknown[];
}

function uploadRequest(form: FormData) {
  return new Request("http://localhost/_server", {
    method: "POST",
    body: form,
    headers: { [BODY_FORMAT_KEY]: BodyFormat.SerovalFormData },
  });
}

describe("server function uploads", () => {
  it("sends files next to other arguments as form parts", async () => {
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });

    const [received, meta] = await roundTrip(file, { tags: ["a"] });

    expect(sent!.headers.get(BODY_FORMAT_KEY)).toBe(BodyFormat.SerovalFormData);
    expect(sent!.headers.get("content-type")).toMatch(/^multipart\/form-data/);
    expect(received).toBeInstanceOf(File);
    expect((received as File).name).toBe("hello.txt");
    expect((received as File).type).toBe("text/plain");
    expect(await (received as File).text()).toBe("hello");
    expect(meta).toEqual({ tags: ["a"] });
  });

  it("finds files anywhere in the arguments", async () => {
    const a = new File(["a"], "a.txt");
    const b = new File(["b"], "b.txt");
    const c = new File(["c"], "c.txt");

    const [value] = (await roundTrip({
      list: [a],
      map: new Map([["b", b]]),
      set: new Set([c]),
    })) as [{ list: File[]; map: Map<string, File>; set: Set<File> }];

    expect(await value.list[0]!.text()).toBe("a");
    expect(await value.map.get("b")!.text()).toBe("b");
    expect(await [...value.set][0]!.text()).toBe("c");
  });

  it("sends the files of form data that is not the only argument", async () => {
    const form = new FormData();
    form.set("name", "avatar");
    form.set("file", new File(["png"], "avatar.png", { type: "image/png" }));

    const [received, count] = (await roundTrip(form, 1)) as [FormData, number];

    expect(received).toBeInstanceOf(FormData);
    expect(received.get("name")).toBe("avatar");
    expect(await (received.get("file") as File).text()).toBe("png");
    expect(count).toBe(1);
  });

  it("sends a file used twice once, and keeps it the same value", async () => {
    const file = new File(["once"], "once.txt");

    const [first, second] = await roundTrip(file, { again: file });

    const form = await sent!.clone().formData();
    expect(form.has(`${FILE_PART}0`)).toBe(true);
    expect(form.has(`${FILE_PART}1`)).toBe(false);
    expect((second as { again: File }).again).toBe(first);
  });

  it("keeps the type of a blob", async () => {
    const [received] = await roundTrip(new Blob(["{}"], { type: "application/json" }), 2);

    expect(received).toBeInstanceOf(Blob);
    expect((received as Blob).type).toBe("application/json");
    expect(await (received as Blob).text()).toBe("{}");
  });

  it("copies a blob from another frame", async () => {
    const source = new Blob(["other"], { type: "text/plain" });
    // Not an instance of this realm's Blob, as one from another frame isn't.
    const foreign = {
      size: source.size,
      type: source.type,
      arrayBuffer: () => source.arrayBuffer(),
      slice: () => source.slice(),
    };

    const [received] = await roundTrip(foreign, 1);

    expect(await (received as Blob).text()).toBe("other");
  });

  it("keeps calls without files as serialized text", async () => {
    await roundTrip({ a: 1 }, 2);

    expect(sent!.headers.get(BODY_FORMAT_KEY)).toBe(BodyFormat.Seroval);
    expect(sent!.headers.get("content-type")).toBe("text/plain");
  });

  it("rejects an upload whose part is missing", async () => {
    const form = new FormData();
    const files: Blob[] = [];
    form.set(
      ARGS_PART,
      await serializeToJSONString([new File(["x"], "x.txt")], [createUploadSerializer(files)]),
    );

    await expect(extractBody("", false, uploadRequest(form))).rejects.toThrow(
      "Malformed server function upload.",
    );
  });

  it("rejects an upload without its arguments", async () => {
    const form = new FormData();
    form.set(`${FILE_PART}0`, new File(["x"], "x.txt"));

    await expect(extractBody("", false, uploadRequest(form))).rejects.toThrow(
      "Malformed server function upload.",
    );
  });

  it("does not read upload indexes from a body that is not multipart", async () => {
    const body = await serializeToJSONString(
      [new File(["x"], "x.txt")],
      [createUploadSerializer([])],
    );

    // A plain body is read without the upload plugin, so the index has no meaning there.
    await expect(deserializeFromJSONString(body)).rejects.toThrow();
  });
});
