import { createAsync } from "@solidjs/router";
import { createEffect } from "solid-js";

const a = "myTreeshakingTestUniqueString1";

function getA() {
  return a;
}

async function getGetA() {
  "use server";

  return getA();
}

export default function Treeshaking() {
  const s = createAsync(() => getGetA());
  createEffect(() => {
    throw new Error('something')
  })
  return <h1>hello: {s()}</h1>;
}
