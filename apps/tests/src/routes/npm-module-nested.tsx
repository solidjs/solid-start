import _ from "lodash";
import { createSignal, onSettled } from "solid-js";

function serverFnWithNpmModule() {
  "use server";

  return _.map([1, 2, 3], x => x * 2);
}

export default function App() {
  const [output, setOutput] = createSignal<{ serverFnWithNpmModule?: number[] }>({});

  onSettled(async () => {
    const result = await serverFnWithNpmModule();
    setOutput(prev => ({ ...prev, serverFnWithNpmModule: result }));
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
