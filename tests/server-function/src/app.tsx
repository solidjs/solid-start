import { join } from 'path';
import { createEffect, createSignal } from "solid-js";
import { isServer } from "solid-js/web";

import "./app.css";

function serverFnWithIsServer() {
  "use server";

  return isServer;
}

function serverFnWithNodeBuiltin() {
  "use server";

  return join('can','externalize');
}

export default function App() {
  const [output, setOutput] = createSignal<{ clientWithIsServer?: boolean; serverFnWithIsServer?: boolean, serverFnWithNodeBuiltin?: string }>({});

  setOutput(prev => ({ ...prev, clientWithIsServer: isServer }));

  createEffect(async () => {
    const restult = await serverFnWithIsServer();
    setOutput(prev => ({ ...prev, serverFnWithIsServer: restult }));
  });

  createEffect(async () => {
    const restult = await serverFnWithNodeBuiltin();
    setOutput(prev => ({ ...prev, serverFnWithNodeBuiltin: restult }));
  });

  return (
    <main>
      <h1>Hello world!</h1>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
