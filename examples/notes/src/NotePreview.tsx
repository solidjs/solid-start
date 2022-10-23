import TextWithMarkdown from "./TextWithMarkdown";

export default function NotePreview(props) {
  return (
    <div class="note-preview">
      <TextWithMarkdown text={props.body} />
    </div>
  );
}
