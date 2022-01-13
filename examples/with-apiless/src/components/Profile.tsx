import { createEffect, createResource, createSignal, Suspense } from "solid-js";
import "./Counter.css";
import { getCounter } from "./profile.api";

export default function Counter() {
  // const [data, { mutate }] = createQuery(() => [], getCounter);
  const [d] = createResource(getCounter, {
    onHydrated: console.log
  });

  // createEffect(() => {
  //   console.log(d(), d.loading);
  // });

  return <button class="increment">Clicks: {d()}</button>;
}
