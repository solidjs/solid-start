import { RouteDefinition, RouteSectionProps, createAsync } from "@solidjs/router";
import { Show } from "solid-js";
import EditButton from "~/components/EditButton";
import { getNotePreview } from "~/lib/api";

export const route = {
  preload({ params }) {
    getNotePreview(+params.id);
  }
} satisfies RouteDefinition;

export default function NotePage({ params }: RouteSectionProps) {
  const note = createAsync(() => getNotePreview(+params.id));
  return (
    <Show when={note()} keyed>
      {note => (
        <div class="note">
          <div class="note-header">
            <h1 class="note-title">{note.title}</h1>
            <div class="note-menu" role="menubar">
              <small class="note-updated-at" role="status">
                Last updated on {note.updatedAt}
              </small>
              <EditButton noteId={note.id}>Edit</EditButton>
            </div>
          </div>
          <div class="note-preview">
            <div class="text-with-markdown" innerHTML={note.body} />
          </div>
        </div>
      )}
    </Show>
  );
}
