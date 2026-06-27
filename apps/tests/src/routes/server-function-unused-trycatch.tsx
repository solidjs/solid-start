import { createEffect, createSignal } from "solid-js";

function serverFnTryCatch() {
  "use server";

  try {
    throw new Error();
  } catch (error) {
    return false;
  }
}

export default function App() {
  const [output, setOutput] = createSignal<boolean>();

  createEffect(async () => {
    const result = await serverFnTryCatch();
    setOutput(result);
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
