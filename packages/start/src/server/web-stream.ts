type PipeableStream = {
  pipe(writable: { write(payload: string): void; end(): void }): void;
};

/** Convert Solid's streaming SSR result into a cancellation-safe web stream. */
export function toWebReadableStream(stream: PipeableStream) {
  const encoder = new TextEncoder();
  let active = true;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      stream.pipe({
        write(payload) {
          if (!active) return;

          // Encoding string to Uint8Array makes sure that
          // the stream can be consumed as Response body
          controller.enqueue(encoder.encode(payload));
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
