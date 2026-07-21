import { createEffect, createSignal } from "solid-js";

async function sleep(value: unknown, ms: number) {
  return new Promise((res) => {
    setTimeout(res, ms, value);
  })
}

async function ping(value: Date) {
  "use server";

  const current = [
    value,
    {
      name: 'example',
      async *[Symbol.asyncIterator]() {
        yield sleep('foo', 5000);
        yield sleep('bar', 5000);
        yield sleep('baz', 5000);
      }
    }
  ];

  return current;
}

export default function App() {
  const [output, setOutput] = createSignal<{ result?: boolean }>({});

  createEffect(async () => {
    const value = new Date();
    const result = await ping(value);
    await ping(value);
    console.log(result);
    setOutput((prev) => ({ ...prev, result: value.toString() === result[0].toString() }));
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
