import { A } from "@solidjs/router";
import Counter from "~/components/Counter";

export default function About() {
  return (
    <main class="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div class="w-full max-w-2xl text-center space-y-8">
        <h1 class="text-6xl text-sky-700 font-thin uppercase">About Page</h1>
        <Counter />
        <p class="text-lg text-gray-700">
          Visit{" "}
          <a href="https://solidjs.com" target="_blank" class="text-sky-600 hover:underline">
            solidjs.com
          </a>{" "}
          to learn how to build Solid apps.
        </p>
        <p class="text-gray-700">
          <A href="/" class="text-sky-600 hover:underline">
            Home
          </A>{" "}
          - About Page
        </p>
      </div>
    </main>
  );
}
