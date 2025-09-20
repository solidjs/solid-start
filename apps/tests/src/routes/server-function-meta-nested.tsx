import { getServerFunctionMeta } from "@solidjs/start";
import { createEffect, createSignal } from "solid-js";

function serverFnWithMeta() {
  "use server";

  return typeof getServerFunctionMeta()?.id;
}

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
