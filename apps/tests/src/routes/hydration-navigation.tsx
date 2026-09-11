import { createAsync, query, useSearchParams } from "@solidjs/router";
import { createSignal, Suspense } from "solid-js";

const getValue = query(async (value: string) => {
  "use server";
  await new Promise(resolve => setTimeout(resolve, 500));
  return value;
}, "hydration-navigation");

export default function HydrationNavigation() {
  const [params] = useSearchParams();
  const value = createAsync(() => getValue(String(params.value || "server")));
  const [count, setCount] = createSignal(0);

  return (
    <main>
      <Suspense fallback={<p>Loading navigation data...</p>}>
        <p id="hydration-navigation-value">{value()}</p>
      </Suspense>
      <button id="hydration-navigation-counter" onClick={() => setCount(count => count + 1)}>
        {count()}
      </button>
    </main>
  );
}
