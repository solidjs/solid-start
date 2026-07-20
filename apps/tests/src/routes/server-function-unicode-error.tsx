async function serverFnThrowsUnicode() {
  "use server";

  // Non-ByteString message (chars > U+00FF) used to crash Headers.set for the
  // X-Error header, producing a bare 500 with no error propagated to the client.
  throw new Error("Ошибка 🚀 ünïcode — special chars");
}

export default function App() {
  return (
    <main>
      <span
        id="server-fn-test"
        onClick={evt => {
          const el = evt.target as HTMLElement;
          serverFnThrowsUnicode().then(
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
