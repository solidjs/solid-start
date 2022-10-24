import { marked } from "marked";
// import sanitizeHtml from "sanitize-html";

// const allowedTags = sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3"]);
// const allowedAttributes = Object.assign({}, sanitizeHtml.defaults.allowedAttributes, {
//   img: ["alt", "src"]
// });

export default function TextWithMarkdown(props) {
  return <div class="text-with-markdown" innerHTML={props.text ? marked(props.text) : ""} />;
}
