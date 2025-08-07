import { useSession } from "~/lib/Context";
import { A } from "@solidjs/router";
import Counter from "~/components/Counter";

export default function Home() {
  const { session } = useSession();

  return (
    <main class="flex items-center justify-center min-h-screen bg-gray-50 text-gray-700 p-4">
      <div class="w-full max-w-2xl text-center space-y-8">
        <h1 class="text-6xl text-sky-700 font-thin uppercase">Hello World!</h1>
        <h3 class="text-xl font-medium">Your email is {session()?.email}</h3>
        <Counter />
        <p class="mt-8 text-lg">
          <A href="/about" class="text-sky-600 hover:underline">
            About Page
          </A>
        </p>
      </div>
    </main>
  );
}
