import { createEffect, createSignal } from "solid-js";

async function sleep<T>(value: T, ms: number) {
  return new Promise<T>((res) => {
    setTimeout(res, ms, value);
  })
}

async function ping(value: ReadableStream<string>) {
  "use server";
  return value;
}

export default function App() {
  const [output, setOutput] = createSignal<{ result?: boolean }>({});

  createEffect(async () => {
    const result = await ping(
      new ReadableStream({
        async start(controller) {
          controller.enqueue(await sleep('foo', 100));
          controller.enqueue(await sleep('bar', 100));
          controller.enqueue(await sleep('baz', 100));
          controller.close();
        },
      })
    );

    const reader = result.getReader();
    const first = await reader.read();
    setOutput((prev) => ({ ...prev, result: first.value === 'foo' }));
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
