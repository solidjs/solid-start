import { Title } from "@solidjs/meta";
import { json } from "@solidjs/router";
import { clientOnly, GET } from "@solidjs/start";
import { getServerFunctionMeta } from "@solidjs/start/server";
import { getRequestEvent } from "solid-js/web";
import Counter from "~/components/Counter";
const BreaksOnServer = clientOnly(() => import("~/components/BreaksOnServer"));

const hello = GET(async (name: string) => {
  "use server";
  const e = getRequestEvent()!;
  const { id } = getServerFunctionMeta()!;
  console.log("ID", id, e.locals.foo);
  return json(
    { hello: new Promise<string>(r => setTimeout(() => r(name), 1000)) },
    { headers: { "cache-control": "max-age=60" } }
  );
});

export default function Home() {
  hello("John").then(async v => {
    console.log(v);
    console.log(await v.hello);
  });
  fetch(`http://localhost:3000/${import.meta.env.SERVER_BASE_URL}/unknown`, {
    headers: { Accept: "application/json" }
  }).then(async res => console.log(await res.json()));
  return (
    <main>
      <Title>Hello World</Title>
      <h1>Hello world!</h1>
      <Counter />
      <BreaksOnServer />
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
