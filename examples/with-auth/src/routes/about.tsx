import { Title } from "@solidjs/meta";
import Counter from "~/components/Counter";

export default function About() {
  return (
    <main>
      <Title>About Page</Title>
      <h1 class="text-center">About Page</h1>
      <Counter />
      <p class="text-gray-700 text-center">
        Visit{" "}
        <a href="https://start.solidjs.com" target="_blank" class="text-sky-600 hover:underline">
          start.solidjs.com
        </a>{" "}
        to learn more on SolidStart
      </p>
    </main>
  );
}
