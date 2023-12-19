import { Title } from "@solidjs/meta";
import { createAsync } from "@solidjs/router";
import Counter from "~/components/Counter";
import { api } from "~/lib/api";

export default function Home() {
  const hello = createAsync(() => api.example.hello.query("world"));
  return (
    <main>
      <Title>Hello World</Title>
      <h1>Hello world!</h1>
      <Counter />
      <p>
        Visit{" "}
        <a href="https://start.solidjs.com" target="_blank">
          start.solidjs.com
        </a>{" "}
        to learn how to build SolidStart apps.
      </p>
      <pre>
        <code>{JSON.stringify(hello(), null, 2)}</code>
      </pre>
    </main>
  );
}
