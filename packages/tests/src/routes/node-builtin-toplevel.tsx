
import { createEffect, createSignal } from "solid-js";
import { serverFnWithNodeBuiltin } from "~/functions/use-node-builtin";

export default function App() {
  const [output, setOutput] = createSignal<{ serverFnWithNodeBuiltin?: string }>({});

  createEffect(async () => {
    const restult = await serverFnWithNodeBuiltin();
    setOutput(prev => ({ ...prev, serverFnWithNodeBuiltin: restult }));
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
