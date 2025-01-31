import { createAsync } from "@solidjs/router";

export const a = 1;

function getA() {
  return a;
}

async function getGetA() {
  "use server";

  return getA() + 1;
}

export default function TreeshakingSideEffects() {
  const s = createAsync(() => getGetA());
  return (
    <h1>
      hello:{a} {s()}
    </h1>
  );
}
