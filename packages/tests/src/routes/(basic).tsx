import { createSignal } from "solid-js";

export default function App() {
  const [counter, setCounter] = createSignal<number>(0);
  
  return (
    <main>
      <span id="counter-output">{counter()}</span>
      <button id="counter-button" onClick={() => setCounter(n => n + 1)}>one more</button>
    </main>
  );
}
