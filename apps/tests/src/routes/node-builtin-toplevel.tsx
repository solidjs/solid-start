import { createEffect, createSignal } from "solid-js";
import { serverFnWithNodeBuiltin } from "~/functions/use-node-builtin";

export default function App() {
  const [output, setOutput] = createSignal<{ serverFnWithNodeBuiltin?: string }>({});

  createEffect(async () => {
    const result = await serverFnWithNodeBuiltin();
    setOutput(prev => ({ ...prev, serverFnWithNodeBuiltin: result }));
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
