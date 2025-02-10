import _ from "lodash";
import { createEffect, createSignal } from "solid-js";

function serverFnWithNpmModule() {
  "use server";

  return _.map([1, 2, 3], x => x * 2);
}

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
