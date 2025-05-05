import { createSignal } from "solid-js";
import "./app.css";
import { MetaProvider } from "@solidjs/meta";
import { FileRoutes } from "@solidjs/start-vite/router";

export default function App() {
  const [count, setCount] = createSignal(0);

  return (
    <MetaProvider>
      <FileRoutes />
    </MetaProvider>
  );
}
