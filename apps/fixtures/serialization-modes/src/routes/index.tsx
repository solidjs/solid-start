import { Title } from "@solidjs/meta";
import { createEffect } from "solid-js";
import Counter from "~/components/Counter";

const breakval = () => {
  "use server";

  return new Date();
};

export default function Home() {
  createEffect(() => {
    console.log(breakval());
  });

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
    </main>
  );
}
