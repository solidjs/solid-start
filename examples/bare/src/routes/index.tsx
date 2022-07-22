import { Stylesheet } from "solid-meta";
import Counter from "~/components/Counter";
import css from "./index.css?url";

export default function Home() {
  return (
    <>
      <Stylesheet href={css} />
      <main>
        <h1>Hello world!</h1>
        <Counter />
        <p>
          Visit{" "}
          <a href="https://solidjs.com" target="_blank">
            solidjs.com
          </a>{" "}
          to learn how to build Solid apps.
        </p>
      </main>
    </>
  );
}
