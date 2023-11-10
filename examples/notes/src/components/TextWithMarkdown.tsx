import { marked } from "marked";

export default function TextWithMarkdown(props: { text: string }) {
  return <div class="text-with-markdown" innerHTML={props.text ? marked(props.text) : ""} />;
}
