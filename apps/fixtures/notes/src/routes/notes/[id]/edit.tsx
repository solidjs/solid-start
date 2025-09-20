import { RouteDefinition, RouteSectionProps, createAsync } from "@solidjs/router";
import { Show } from "solid-js";
import NoteEditor from "~/components/NoteEditor";
import { getNote } from "~/lib/api";

export const route = {
  preload({ params }) {
    getNote(+params.id);
  }
} satisfies RouteDefinition;

export default function EditNote({ params }: RouteSectionProps) {
  const note = createAsync(() => getNote(+params.id));
  return (
    <Show when={note()}>
      <NoteEditor noteId={+params.id} initialTitle={note()!.title} initialBody={note()!.body} />
    </Show>
  );
}
