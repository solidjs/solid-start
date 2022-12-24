import { Title, useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import Counter from "~/components/Counter";

export const routeData = () => {
  return createServerData$(() => {
    // @ts-ignore
    const t = process.env.SERVER_TEST;
    // @ts-ignore
    const s = process.env.VITE_TEST; // not defined - as expected
    console.log({ s, t }); // equals 2
    return t;
  });
};
export default function Home() {
  console.log("client", import.meta.env.VITE_TEST); // equals 1
  useRouteData<typeof routeData>();
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
