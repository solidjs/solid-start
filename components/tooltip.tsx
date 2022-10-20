import { createEffect } from "solid-js";
import { isServer } from "solid-js/web";
let tippy;
if (!isServer) {
  tippy = await import("tippy.js");
}

export default function Tooltip(props) {
  createEffect(() => {
    if (!isServer) {
      tippy.default(`[data-template="${props.id}"]`, {
        content() {
          const template = document.getElementById(props.id);
          return template.innerHTML;
        },
        allowHTML: true
      });
    }
  });
  return (
    <span class={`data-lsp`} data-template={props.id}>
      {props.children}
    </span>
  );
}
