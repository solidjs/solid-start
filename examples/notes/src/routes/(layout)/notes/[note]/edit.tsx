import { Show } from "solid-js";
import { RouteDataArgs, useParams, useRouteData } from "solid-start";
import { NoteEditor } from "~/components/NoteEditor";

import { useNote } from "./useNote";

export function routeData({ params }: RouteDataArgs<"/notes/[note]">) {
  return useNote(params);
}

export default function EditNote() {
  const note = useRouteData<"/notes/[note]">();
  return (
    <Show when={note()}>
      <NoteEditor noteId={useParams().note} initialTitle={note().title} initialBody={note().body} />
    </Show>
  );
}
