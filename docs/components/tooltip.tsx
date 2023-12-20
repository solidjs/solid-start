import { createEffect } from "solid-js";

let tippy;

function applyTippy(id) {
  tippy.default(`[data-template="${id}"]`, {
    content() {
      const template = document.getElementById(id);
      return template.innerHTML;
    },
    allowHTML: true
  });
}

export default function Tooltip(props) {
  createEffect(async () => {
    const id = props.id;
    tippy || (tippy = await import("tippy.js"));
    applyTippy(id);
  });
  return (
    <span class={`data-lsp`} data-template={props.id}>
      {props.children}
    </span>
  );
}
