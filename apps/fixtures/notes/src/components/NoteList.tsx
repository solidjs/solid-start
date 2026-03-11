import { For, createMemo, Show } from "solid-js";
import { getNotes } from "~/lib/api";
import SidebarNote from "./SidebarNote";

export default function NoteList(props: { searchText: string }) {
  const notes = createMemo(() => getNotes(props.searchText));

  return (
    <Show
      when={notes().length > 0}
      fallback={
        <div class="notes-empty">
          {props.searchText
            ? `Couldn't find any notes titled "${props.searchText}".`
            : "No notes created yet!"}
        </div>
      }
    >
      <ul class="notes-list">
        <For each={notes()}>
          {note => (
            <li>
              <SidebarNote note={note()} />
            </li>
          )}
        </For>
      </ul>
    </Show>
  );
}
