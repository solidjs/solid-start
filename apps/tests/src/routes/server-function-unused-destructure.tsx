import { createEffect, createSignal } from "solid-js";

function serverFnDestructure() {
  "use server";

  const rawItems = [{ id: "", age: 42 }];
  const items: { age: number }[] = [];
  for (const { id, ...rest } of rawItems) {
    items.push(rest);
  }

  return false;
}

export default function App() {
  const [output, setOutput] = createSignal<boolean>();

  createEffect(async () => {
    const result = await serverFnDestructure();
    setOutput(result);
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
