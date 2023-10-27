import { Title } from "solid-start";
import Counter from "~/components/Counter";
import { api } from "~/utils/api";

export default function Home() {
  const hello = api.example.hello.useQuery(() => "World");
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
        <code>{JSON.stringify(hello.data, null, 2)}</code>
      </pre>
    </main>
  );
}
