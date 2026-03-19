import { createEffect, createSignal } from "solid-js";
import { isServer } from "solid-js/web";
import { serverSecret } from "~/functions/server-secret";
import { keepAlive } from "~/utils/keep-alive-util";

function serverFnWithIsServer() {
  "use server";
  keepAlive("MyServerSuperSecretUniqueString3");
  keepAlive(serverSecret);
  return isServer;
}

export default function App() {
  const [output, setOutput] = createSignal<{ serverFnWithIsServer?: boolean }>({});

  createEffect(async () => {
    const result = await serverFnWithIsServer();
    setOutput(prev => ({ ...prev, serverFnWithIsServer: result }));
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
