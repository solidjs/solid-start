import { createSignal, onSettled } from "solid-js";

async function ping(value: Date) {
  "use server";

  const current = [
    value,
    {
      name: "example",
      *[Symbol.iterator]() {
        yield "foo";
        yield "bar";
        yield "baz";
      },
    },
  ];

  return current;
}

export default function App() {
  const [output, setOutput] = createSignal<{ result?: boolean }>({});

  onSettled(() => {
    void (async () => {
      const value = new Date();
      const result = await ping(value);
      setOutput(prev => ({ ...prev, result: value.toString() === result[0].toString() }));
    })();
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
