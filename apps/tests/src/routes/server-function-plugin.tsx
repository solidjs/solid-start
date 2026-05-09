import { createEffect, createSignal } from "solid-js";

async function sleep(value: unknown, ms: number) {
  return new Promise((res) => {
    setTimeout(res, ms, value);
  })
}

async function ping(value: URLSearchParams, clone: URLSearchParams) {
  "use server";

  const current = [
    value.toString() === clone.toString(),
    value,
    clone,
  ] as const;

  return current;
}

export default function App() {
  const [output, setOutput] = createSignal<{ result?: boolean }>({});

  createEffect(async () => {
    const value = new URLSearchParams([
      ['foo', 'bar'],
      ['hello', 'world'],
    ]);
    const result = await ping(value, value);
    setOutput((prev) => ({ ...prev, result: result[0] }));
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
