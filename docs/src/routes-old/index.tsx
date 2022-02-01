import { Link } from "solid-app-router";

export default function Home() {
  return (
    <>
      <nav class="bg-blue-400 p-4">SolidStart Docs</nav>

      <div class="flex">
        <aside class="bg-gray-200 p-4 h-full flex flex-col">
          <Link href="#before-we-begin">Before we begin</Link>
          <Link href="#getting-started">Getting Started</Link>
          <Link href="#routing">Routing</Link>
        </aside>
        <main class="max-w-prose m-auto">
          <h1 class="text-center text-2xl font-bold mb-4">SolidStart</h1>

          <section class="mb-4" id="before-we-begin">
            <h2 class="text-xl font-bold mb-2">Before we begin</h2>
            <p>
              SolidStart is a metaframework for building web applications. It is similar to NextJS
              and SvelteKit, but it is made for Solid
            </p>
          </section>

          <section class="mb-4" id="getting-started">
            <h2 class="text-xl font-bold mb-2">Getting Started</h2>
            <p>Create a new project with</p>
            <pre class="bg-gray-200 p-4 rounded-lg">
              <code class="text-gray-800">npm init solid@next</code>
            </pre>
          </section>

          <section class="mb-4" id="routing">
            <h2 class="text-xl font-bold mb-2">Routing</h2>
            <p>
              SolidStart uses file based routing. The <code>src/routes</code> folder contains the
              routes.
            </p>
          </section>
        </main>
      </div>
    </>
  );
}
