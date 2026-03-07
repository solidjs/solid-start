import { join } from "node:path";
import { createSignal, onSettled } from "solid-js";

function serverFnWithNodeBuiltin() {
  "use server";

  return join("can", "externalize");
}

export default function App() {
  const [output, setOutput] = createSignal<{ serverFnWithNodeBuiltin?: string }>({});

  onSettled(async () => {
    const result = await serverFnWithNodeBuiltin();
    setOutput(prev => ({ ...prev, serverFnWithNodeBuiltin: result }));
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
