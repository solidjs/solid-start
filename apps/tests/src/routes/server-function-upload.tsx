import { createEffect, createSignal } from "solid-js";

async function upload(file: File, meta: { tags: string[]; attachments: Blob[] }, form: FormData) {
  "use server";
  const attachments = await Promise.all(meta.attachments.map(blob => blob.text()));
  const avatar = form.get("avatar") as File;
  return {
    name: file.name,
    text: await file.text(),
    tags: meta.tags,
    attachments,
    avatar: `${avatar.name}:${await avatar.text()}`
  };
}

export default function App() {
  const [output, setOutput] = createSignal<unknown>();

  createEffect(async () => {
    const form = new FormData();
    form.set("avatar", new File(["png"], "avatar.png", { type: "image/png" }));
    setOutput(
      await upload(
        new File(["Hello, World!"], "hello-world.txt"),
        { tags: ["a", "b"], attachments: [new Blob(["one"]), new Blob(["two"])] },
        form
      )
    );
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
