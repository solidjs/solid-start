import { Show } from "solid-js";
import { useParams, useRouteData } from "solid-start";
import { NoteEditor } from "./NoteEditor";

import { useNote } from "../useNote";

export function routeData({ params }) {
  return useNote(params);
}

export default function EditNote() {
  const note = useRouteData<typeof routeData>();
  return (
    <Show when={note()}>
      <NoteEditor noteId={useParams().note} initialTitle={note().title} initialBody={note().body} />
    </Show>
  );
}
