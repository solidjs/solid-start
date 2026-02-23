import { createEffect, createSignal } from "solid-js";
import * as testModule from "~/functions/solid-router-query";

export default function App() {
  const [output, setOutput] = createSignal<boolean | null>();

  createEffect(() => {
    setOutput('testQuery' in testModule);
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
