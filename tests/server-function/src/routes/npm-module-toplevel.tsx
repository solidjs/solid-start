import { createEffect, createSignal } from "solid-js";
import { serverFnWithNpmModule } from "~/functions/use-npm-module";

export default function App() {
  const [output, setOutput] = createSignal<{ serverFnWithNpmModule?: number[] }>({});

  createEffect(async () => {
    const restult = await serverFnWithNpmModule();
    setOutput(prev => ({ ...prev, serverFnWithNpmModule: restult }));
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
