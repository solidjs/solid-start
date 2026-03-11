import { getServerFunctionMeta } from "@solidjs/start";
import { createSignal, onSettled } from "solid-js";

function serverFnWithMeta() {
  "use server";

  return typeof getServerFunctionMeta()?.id;
}

export default function App() {
  const [output, setOutput] = createSignal<{ serverFnWithMeta?: string }>({});

  onSettled(async () => {
    const result = await serverFnWithMeta();
    setOutput(prev => ({ ...prev, serverFnWithMeta: result }));
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
