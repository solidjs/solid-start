import _ from "lodash";
import { join } from 'path';
import { createEffect, createSignal } from "solid-js";
import { isServer } from "solid-js/web";

export default function App() {
  const [output, setOutput] = createSignal<{ clientWithIsServer?: boolean; }>({});

  setOutput(prev => ({ ...prev, clientWithIsServer: isServer }));

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
