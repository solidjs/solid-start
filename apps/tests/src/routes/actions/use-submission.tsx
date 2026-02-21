import { Title } from "@solidjs/meta";
import { action, useSubmission } from "@solidjs/router";
import { Show } from "solid-js";

const TEXT = `
Roses are red,
Violets are blue,
SolidStart is shiny,
And so are you.

Code flows like rivers,
Logic sings in rhyme,
Building with passion,
One commit at a time.
`;

const actionStuff = action(async () => {
  "use server";

  return "Hello world!";
}, "actionStuff");

export default function Home() {
  const actionData = useSubmission(actionStuff);
  return (
    <main>
      <Title>Hello World</Title>
      <form action={actionStuff} method="post">
        <button type="submit">Click me</button>
      </form>

      <Show when={actionData}>{result => <p>{result().result}</p>}</Show>
    </main>
  );
}
