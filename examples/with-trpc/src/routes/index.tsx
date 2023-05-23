import { Title } from "solid-start";
import { api } from "~/utils/api";

export default function Home() {
  const hello = api.example.hello.useQuery(() => "World");
  return (
    <main>
      <Title>Hello World</Title>
      <h1>tRPC says:</h1>
      <pre>
        <code>{JSON.stringify(hello.data, null, 2)}</code>
      </pre>
    </main>
  );
}
