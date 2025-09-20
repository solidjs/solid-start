import { createEffect, createSignal } from "solid-js";
import { serverFnWithMeta } from "~/functions/use-server-function-meta";

export default function App() {
  const [output, setOutput] = createSignal<{ serverFnWithMeta?: string }>({});

  createEffect(async () => {
    const result = await serverFnWithMeta();
    setOutput(prev => ({ ...prev, serverFnWithMeta: result }));
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
