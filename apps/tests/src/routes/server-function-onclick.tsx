async function serverFnOnClick() {
  "use server";

  return false;
}

export default function App() {
  return (
    <main>
      <span
        id="server-fn-test"
        onClick={evt => {
          const el = evt.target;
          serverFnOnClick().then(r => {
            el.textContent = JSON.stringify(r);
          });
        }}
      >
        Click me
      </span>
    </main>
  );
}
