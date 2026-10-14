async function serverFnThrowsReplaceable() {
  "use server";

  // `src/server-fn-error.ts` swaps this one out for a different error before it
  // is serialized, which is what the client below should end up displaying.
  throw new Error("replace me");
}

export default function App() {
  return (
    <main>
      <span
        id="server-fn-test"
        onClick={evt => {
          const el = evt.target as HTMLElement;
          serverFnThrowsReplaceable().then(
            () => {
              el.textContent = "no error";
            },
            err => {
              el.textContent = err instanceof Error ? err.message : String(err);
            },
          );
        }}
      >
        Click me
      </span>
    </main>
  );
}
