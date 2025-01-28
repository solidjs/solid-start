import { createEffect, createSignal } from "solid-js";
import { isServer } from "solid-js/web";

function serverFnWithIsServer() {
  "use server";

  return isServer;
}

export default function App() {
  const [output, setOutput] = createSignal<{  serverFnWithIsServer?: boolean }>({});


  createEffect(async () => {
    const restult = await serverFnWithIsServer();
    setOutput(prev => ({ ...prev, serverFnWithIsServer: restult }));
  });


  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
