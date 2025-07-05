import { Title } from "@solidjs/meta";
import { useLang } from "~/lang/core";
import Counter from "~/components/Counter";

export default function Home() {
  const { messages } = useLang();
  return (
    <>
      <Title>Hello World</Title>

      <h1>{messages().hello_world().toUpperCase()}</h1>

      {/* Welcome message with dynamic username */}
      <p>
        {messages().example_message({ username: "SolidStart" })}
      </p>

      {/* Counter Component */}
      <div class="container">
        <Counter/>
      </div>

      {/* Learn more section */}
      <p>
        {messages().visit()}{" "}
        <a href="https://start.solidjs.com" target="_blank" rel="noopener noreferrer">
          start.solidjs.com
        </a>{" "}
        {messages().learn_solidstart()}
      </p>
    </>
  );
}
