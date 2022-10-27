import { For, Show, Suspense } from "solid-js";
import { createServerData$ } from "solid-start/server";
import SidebarNote from "./SidebarNote";

export function NoteList({ searchText }) {
  // const notes = fetch('http://localhost:4000/notes').json();

  // WARNING: This is for demo purposes only.
  // We don't encourage this in real apps. There are far safer ways to access
  // data in a real application!
  const notes = createServerData$(async (_, { env }) => {
    const d = env.DO.get(env.DO.idFromName("notes"));
    return (await d.fetch("https://notes")).json();
  });

  return (
    <Suspense fallback={<div>Waiting</div>}>
      <Show
        when={notes()?.length > 0}
        fallback={
          <div class="notes-empty">
            {searchText
              ? `Couldn't find any notes titled "${searchText}".`
              : "No notes created yet!"}{" "}
          </div>
        }
      >
        <ul class="notes-list">
          <For each={notes()}>
            {note => (
              <li>
                <SidebarNote note={note} />
              </li>
            )}
          </For>
        </ul>
      </Show>
    </Suspense>
  );
}
