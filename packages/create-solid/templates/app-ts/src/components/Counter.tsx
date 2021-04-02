import { createSignal, onCleanup, onMount } from "solid-js";

export default function Counter() {
  const [count, setCount] = createSignal(0);

  onMount(() => {
    const t = setInterval(() => setCount(count() + 1), 1000);
    onCleanup(() => clearInterval(t));
  });

  return <div>{count()}</div>;
}