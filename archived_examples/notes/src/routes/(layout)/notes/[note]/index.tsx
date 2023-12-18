import { useParams, useRouteData, useSearchParams } from "solid-start";
import { Note } from "./Note";
import { useNote } from "./useNote";

export function routeData({ params }) {
  return useNote(params);
}

export default function NotePage() {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const note = useRouteData<typeof routeData>();
  return <Note selectedId={params.note} note={note()} isEditing={searchParams.isEditing} />;
}
