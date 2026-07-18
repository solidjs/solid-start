type PipeableStream = {
  pipe(writable: { write(payload: string): void; end(): void }): void;
};

/** Convert Solid's streaming SSR result into a cancellation-safe web stream. */
export function toWebReadableStream(stream: PipeableStream): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let active = true;

  return new ReadableStream({
    start(controller) {
      stream.pipe({
        write(payload) {
          if (active) controller.enqueue(encoder.encode(payload));
        },
        end() {
          if (!active) return;
          active = false;
          controller.close();
        },
      });
    },
    cancel() {
      // Solid may still resolve Suspense resources after the response is
      // cancelled. Ignore those writes and let Solid finish its cleanup.
      active = false;
    },
  });
}
