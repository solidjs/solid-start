import Counter from "~/components/Counter";
import Profile from "~/components/Profile";
import { Link } from "solid-app-router";

export default function Home() {
  return (
    <main>
      <h1>Hello world!</h1>
      <Counter />
      <Profile />
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
