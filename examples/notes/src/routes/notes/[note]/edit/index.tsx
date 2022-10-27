import { Show } from "solid-js";
import { useParams, useRouteData } from "solid-start";
import { routeData } from "../layout";
import { NoteEditor } from "./NoteEditor";

export default function EditNote() {
  const note = useRouteData<typeof routeData>();
  return (
    <Show when={note()}>
      <NoteEditor noteId={useParams().note} initialTitle={note().title} initialBody={note().body} />
    </Show>
  );
}
