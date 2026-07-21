import { createEffect, createSignal } from "solid-js";

async function ping(value: string) {
  "use server";

  return await Promise.resolve(value);
}

export default function App() {
  const [output, setOutput] = createSignal<{ result?: boolean }>({});

  createEffect(async () => {
    const value = `${Math.random() * 1000}`;
    const result = await ping(value);
    setOutput(prev => ({ ...prev, result: value === result }));
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
