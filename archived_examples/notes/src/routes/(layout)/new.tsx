import { NoteEditor } from "~/components/NoteEditor";

export default function NewPage() {
  return <NoteEditor noteId={null} initialTitle="Untitled" initialBody="" />;
}