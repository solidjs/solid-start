import { createEffect, createSignal } from "solid-js";

async function ping(value: FormData) {
  "use server";
  const file = value.get("example") as File;
  return await file.text();
}

export default function App() {
  const [output, setOutput] = createSignal<{ result?: boolean }>({});

  createEffect(async () => {
    const file = new File(["Hello, World!"], "hello-world.txt");
    const formData = new FormData();
    formData.append("example", file);
    const result = await ping(formData);
    const value = await file.text();
    setOutput(prev => ({ ...prev, result: value === result }));
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
