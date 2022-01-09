import { createEffect, createResource, createSignal } from "solid-js";
import "./Counter.css";
import { getCounter } from "./counter.api";

export default function Counter() {
  // const [data, { mutate }] = createQuery(() => [], getCounter);
  const [d] = createResource(getCounter, {
    onHydrated: console.log
  });

  return <button class="increment">Clicks: {d()}</button>;
}
