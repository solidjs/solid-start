import Counter from "~/components/Counter";
import { Link } from "solid-app-router";

export default function NotFound() {
  return (
    <main>
      <h1>Page Not Found</h1>
      <p>
        Visit{" "}
        <a href="https://solidjs.com" target="_blank">
          solidjs.com
        </a>{" "}
        to learn how to build Solid apps.
      </p>
    </main>
  );
}
