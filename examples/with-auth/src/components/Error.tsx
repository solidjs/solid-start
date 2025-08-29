import { useSearchParams } from "@solidjs/router";
import { createEffect, onCleanup, Show } from "solid-js";
import { X } from "./Icons";

export default function ErrorNotification() {
  const [searchParams, setSearchParams] = useSearchParams();

  createEffect(() => {
    if (searchParams.error) {
      const timer = setTimeout(() => setSearchParams({ error: "" }), 5000);
      onCleanup(() => clearTimeout(timer));
    }
  });

  return (
    <Show when={typeof searchParams.error === "string" && searchParams.error} keyed>
      {msg => (
        <aside class="flex items-start gap-3 fixed bottom-4 left-4 max-w-sm bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg z-50 transition-all duration-300 text-sm">
          <div>
            <strong class="font-medium text-red-800">Error</strong>
            <p class="text-red-700 mt-1 select-text">{msg}</p>
          </div>
          <button
            onclick={() => setSearchParams({ error: "" })}
            class="text-red-400 hover:text-red-600 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </aside>
      )}
    </Show>
  );
}
