import { createSignal } from "solid-js";
import { serverFnWithIsServer } from "~/functions/use-is-server";

export default function App() {
  const [output, setOutput] = createSignal("pending");

  const call = async () => {
    try {
      await serverFnWithIsServer();
      setOutput("resolved");
    } catch {
      setOutput("rejected");
    }
  };

  return (
    <main>
      <button id="call" onClick={() => void call()}>
        call
      </button>
      <span id="server-fn-test">{output()}</span>
    </main>
  );
}
