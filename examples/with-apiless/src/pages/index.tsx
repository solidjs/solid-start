import Counter from "~/components/Counter";
import { Link } from "solid-app-router";
import "./index.css";

export default function Home() {
  return (
    <main>
      <h1>Hello world!</h1>
      <Counter />
      <p>
        Visit{" "}
        <a href="https://solidjs.com" target="_blank">
          solidjs.com
        </a>{" "}
        to learn how to build Solid apps.
        <Link href="/docs">Docs</Link>
      </p>
    </main>
  );
}
