import { RouteDefinition, RouteSectionProps } from "@solidjs/router";
import { Show, createMemo } from "solid-js";
import NoteEditor from "~/components/NoteEditor";
import { getNote } from "~/lib/api";

export const route = {
  preload({ params }) {
    getNote(+params.id);
  },
} satisfies RouteDefinition;

export default function EditNote({ params }: RouteSectionProps) {
  const note = createMemo(() => getNote(+params.id));
  return (
    <Show when={note()}>
      <NoteEditor noteId={+params.id} initialTitle={note()!.title} initialBody={note()!.body} />
    </Show>
  );
}
