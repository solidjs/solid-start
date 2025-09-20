import { createSignal } from "solid-js";
import { isServer } from "solid-js/web";


export default function ClientOnlyComponent() {
    const [output, setOutput] = createSignal<{ clientWithIsServer?: boolean; }>({});

    setOutput(prev => ({ ...prev, clientWithIsServer: isServer }));
  
    return (
        <main>
        <span id="server-fn-test">{JSON.stringify(output())}</span>
      </main>)
}