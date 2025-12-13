import { createSignal, onMount } from "solid-js";
import { sayHello } from "~/functions/use-generator-server-function";

export default function GeneratorServerFunction() {
  const [output, setOutput] = createSignal<string>("");

  onMount(async () => {
    const greetings = await sayHello();
    for await (const greeting of greetings) {
      setOutput(greeting);
    }
  });

  return (
    <main>
      <div id="server-fn-test">{output()}</div>
    </main>
  );
}
