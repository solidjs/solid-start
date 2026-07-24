type PipeableStream = {
  pipe(writable: { write(payload: string): void; end(): void }): void;
};

/** Convert Solid's streaming SSR result into a cancellation-safe web stream. */
export function toWebReadableStream(stream: PipeableStream) {
  const encoder = new TextEncoder();
  let active = true;

  let resolveShell: (value?: unknown) => void;
  let shellRendered = new Promise(res => (resolveShell = res));

  let controller: ReadableStreamDefaultController | undefined = undefined;
  const cachedPayloads: string[] = [];

  stream.pipe({
    write(payload) {
      if (!active) return;

      resolveShell();

      if (controller) {
        controller.enqueue(encoder.encode(payload));
      } else {
        cachedPayloads.push(payload);
      }
    },
    end() {
      if (!active) return;
      active = false;
      controller?.close();
    },
  });

  return [
    new ReadableStream<Uint8Array>({
      start(c) {
        controller = c;
        for (const payload of cachedPayloads) {
          controller.enqueue(encoder.encode(payload));
        }

        if (!active) controller.close();
      },
      cancel() {
        // Solid may still resolve Suspense resources after the response is
        // cancelled. Ignore those writes and let Solid finish its cleanup.
        active = false;
      },
    }),
    shellRendered,
  ] as const;
}
