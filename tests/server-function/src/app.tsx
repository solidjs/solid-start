import { createEffect, createSignal } from "solid-js";
import { isServer } from "solid-js/web";
import "./app.css";

function useServer() {
  "use server";
  return isServer;
}
export default function App() {
  const [output, setOutput] = createSignal<{ client?: boolean; serverFn?: boolean }>({});

  setOutput(prev => ({ ...prev, client: isServer }));

  createEffect(async () => {
    const restult = await useServer();
    setOutput(prev => ({ ...prev, serverFn: restult }));
  });

  return (
    <main>
      <h1>Hello world!</h1>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
