import { createEffect, createSignal, sharedConfig } from "solid-js";

export default function Toggle(props) {
  console.log(sharedConfig.context.id);
  const [open, setOpen] = createSignal(true);
  createEffect(() => {
    console.log(open());
  });
  return (
    <>
      <div class="toggle" classList={{ open: open() }}>
        <a onClick={() => setOpen(o => !o)}>{open() ? "[-]" : "[+] comments collapsed"}</a>
      </div>
      <ul class="comment-children" style={{ display: open() ? "block" : "none" }}>
        {props.children}
      </ul>
    </>
  );
}
