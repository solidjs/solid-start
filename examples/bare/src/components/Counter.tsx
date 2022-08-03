import { createSignal } from "solid-js";
import "./counter.css";

export default function Counter() {
  const [count, setCount] = createSignal(0);
  return (
    <button class="increment" onClick={() => setCount(count() + 1)}>
      Clicks: {count}
    </button>
  );
}
