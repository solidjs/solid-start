import { Title } from "@solidjs/meta";
import { createEffect } from "solid-js";
import Counter from "~/components/Counter";

// const getDate = action(async () => {
//   "use server";

//   console.log("Page query executed");

//   return new Date();
// }, "date");

const breakval = () => {
  "use server";

  return new Date();
};

export default function Home() {
  createEffect(() => {
    console.log(breakval());
  });

  // setTimeout(() => {
  //   eval("console.log('This should not execute')");
  // }, 3000);
  return (
    <main>
      <Title>Hello World</Title>
      <h1>Hello world!</h1>
      <Counter />
      {/* <form method="post" action={getDate}>
        <button type="submit">Get current date</button>
      </form>
      <Suspense>
        <Show when={data()} fallback={<p>Loading...</p>}>
          <p>Current date: {String(data())}</p>
        </Show>
      </Suspense> */}
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
