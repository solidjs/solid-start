import TextWithMarkdown from "~/components/TextWithMarkdown";

export function NotePreview(props) {
  return (
    <div class="note-preview">
      <TextWithMarkdown text={props.body} />
    </div>
  );
}
