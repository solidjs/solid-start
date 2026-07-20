import { createComponent, createResource, Suspense } from "solid-js";
import { renderToStream } from "solid-js/web";
import { describe, expect, it } from "vitest";

import { toWebReadableStream } from "./web-stream.ts";

describe("toWebReadableStream", () => {
  it("returns encoded output as a standard ReadableStream", async () => {
    const readable = toWebReadableStream({
      pipe(writable) {
        writable.write("Hello, ");
        writable.write("world!");
        writable.end();
      },
    });

    expect(readable).toBeInstanceOf(ReadableStream);
    await expect(new Response(readable).text()).resolves.toBe("Hello, world!");
  });

  it("ignores writes after the consumer cancels", async () => {
    let writable!: { write(payload: string): void; end(): void };
    const readable = toWebReadableStream({
      pipe(value) {
        writable = value;
        writable.write("shell");
      },
    });
    const reader = readable.getReader();

    const shell = await reader.read();
    expect(new TextDecoder().decode(shell.value)).toBe("shell");

    await reader.cancel("client disconnected");

    expect(() => writable.write("late Suspense content")).not.toThrow();
    expect(() => writable.end()).not.toThrow();
  });

  it("allows Solid to finish Suspense work after cancellation", async () => {
    let resolveData!: (value: string) => void;
    let resolveComplete!: () => void;
    const complete = new Promise<void>(resolve => {
      resolveComplete = resolve;
    });
    const stream = renderToStream(
      () => {
        const [data] = createResource(
          () =>
            new Promise<string>(resolve => {
              resolveData = resolve;
            }),
        );
        return createComponent(Suspense, {
          fallback: "loading",
          get children() {
            return data();
          },
        });
      },
      { onCompleteAll: () => resolveComplete() },
    );
    const reader = toWebReadableStream(stream).getReader();

    const shell = await reader.read();
    expect(new TextDecoder().decode(shell.value)).toContain("loading");

    await reader.cancel("client disconnected");
    resolveData("late Suspense content");

    await expect(complete).resolves.toBeUndefined();
  });
});
