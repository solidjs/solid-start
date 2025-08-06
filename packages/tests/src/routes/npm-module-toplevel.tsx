import { createEffect, createSignal } from "solid-js";
import { serverFnWithNpmModule } from "~/functions/use-npm-module";

export default function App() {
  const [output, setOutput] = createSignal<{ serverFnWithNpmModule?: number[] }>({});

  createEffect(async () => {
    const result = await serverFnWithNpmModule();
    setOutput(prev => ({ ...prev, serverFnWithNpmModule: result }));
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
