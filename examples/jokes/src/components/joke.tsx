import type { Joke } from "@prisma/client";
import { Link } from "solid-app-router";
import { Show } from "solid-js";
import server, { redirect } from "solid-start/server";
import { createForm } from "solid-start/form";
import { db } from "~/utils/db.server";

const DeleteJokeForm = createForm(
  server(async (form: FormData) => {
    let jokeId = form.get("jokeId") as string;
    const joke = await db.joke.findUnique({
      where: { id: jokeId },
    });

    if (!joke) {
      throw new Response("Can't delete what does not exist", { status: 404 });
    }

    await db.joke.delete({ where: { id: jokeId } });
    throw redirect("/jokes");
  })
);

export function JokeDisplay(props: {
  joke: Pick<Joke, "content" | "name" | "id">;
  isOwner: boolean;
  canDelete?: boolean;
}) {
  return (
    <div>
      <p>Here's your hilarious joke:</p>
      <p>{props.joke.content}</p>
      <Link href=".">{props.joke.name} Permalink</Link>
      <Show when={props.isOwner}>
        <DeleteJokeForm>
          <input type="hidden" name="jokeId" value={props.joke.id} />
          <button
            type="submit"
            name="action"
            value="delete"
            className="button"
            disabled={!(props.canDelete ?? true)}
          >
            Delete
          </button>
        </DeleteJokeForm>
      </Show>
    </div>
  );
}
