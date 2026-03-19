import { createMemo } from "solid-js";

export const a = 1;

function getA() {
  return a;
}

async function getGetA() {
  "use server";

  return getA() + 1;
}

export default function TreeshakingSideEffects() {
  const s = createMemo(() => getGetA());
  return (
    <h1>
      hello:{a} {s()}
    </h1>
  );
}
