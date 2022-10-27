import { useParams, useSearchParams } from "solid-start";
import { Note } from "./Note";

export default function NotePage() {
  const [searchParams] = useSearchParams();
  const params = useParams();
  return <Note selectedId={params.note} isEditing={searchParams.isEditing} />;
}
