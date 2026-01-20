import { createEffect, createSignal } from "solid-js";

async function ping(file: File) {
  "use server";
  return await file.text();
}

export default function App() {
  const [output, setOutput] = createSignal<{ result?: boolean }>({});

  createEffect(async () => {
    const file = new File(['Hello, World!'], 'hello-world.txt');
    const result = await ping(file);
    const value = await file.text();
    setOutput(prev => ({ ...prev, result: value === result }));
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
