import { createAsync } from "@solidjs/router";

const a = 1;

function getA() {
  return a;
}

async function getGetA() {
  "use server";

  return getA();
}

export default function Treeshaking() {
  const s = createAsync(() => getGetA());
  return <h1>hello: {s()}</h1>;
}
