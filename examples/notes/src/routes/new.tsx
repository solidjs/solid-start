import { NoteEditor } from "./notes/[note]/edit/NoteEditor";

export default function NewPage() {
  return <NoteEditor noteId={null} initialTitle="Untitled" initialBody="" />;
}
