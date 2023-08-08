import { For, Show, Suspense } from "solid-js";
import { createServerData$ } from "solid-start/server";
import SidebarNote from "../components/SidebarNote";

export function NoteList(props: { searchText: string }) {
  // WARNING: This is for demo purposes only.
  // We don't encourage this in real apps. There are far safer ways to access
  // data in a real application!
  const notes = createServerData$(async (_, { env }) => env.notes.list());

  return (
    <Suspense fallback={<div>Waiting</div>}>
      <Show
        when={notes()?.length > 0}
        fallback={
          <div class="notes-empty">
            {props.searchText
              ? `Couldn't find any notes titled "${props.searchText}".`
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
