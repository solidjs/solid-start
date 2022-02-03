import { db } from "~/db";
import server, { redirect } from "solid-start/server";
import { FormError, createForm, FormSubmission } from "solid-start/form";
import { createEffect, createResource, ErrorBoundary, For, Index, Show } from "solid-js";
import { Prisma, User } from "@prisma/client";

const addPlayer = createForm(
  server(async (form: FormData) => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    try {
      await db.user.create({
        data: {
          firstName: form.get("firstName") as string,
          lastName: form.get("lastName") as string,
          characterName: form.get("firstName") + " " + form.get("lastName")
        }
      });

      return redirect("/");
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (e.code === "P2002") {
          throw new FormError(
            "There is a unique constraint violation, a new player cannot be created with this name",
            {
              fieldErrors: {
                [(e.meta as any).target[0]]: "unique"
              }
            }
          );
        }
      }
    }
  })
);

function OptimisticPlayer(props: { submission: FormSubmission }) {
  return (
    <li
      class="flex flex-row space-y-2"
      style={{ color: props.submission.error ? "red" : "darkgray" }}
    >
      {props.submission.variables.get("firstName") as string}{" "}
      {props.submission.variables.get("lastName") as string}
      {/* Retry form when there is an error with an add (switch firtname lastname for fun) */}
      <Show when={props.submission.error}>
        {error => (
          <>
            {error.message}{" "}
            <addPlayer.Form key={props.submission.key}>
              <input
                type="hidden"
                value={props.submission.variables.get("firstName") as string}
                name="lastName"
                placeholder="curry"
              />
              <input
                type="hidden"
                value={props.submission.variables.get("lastName") as string}
                name="firstName"
                placeholder="steph"
              />
              <button type="submit">Retry</button>
            </addPlayer.Form>
          </>
        )}
      </Show>
    </li>
  );
}

function AddPlayer() {
  let formRef: HTMLFormElement;
  let firstNameRef: HTMLInputElement;

  createEffect(() => {
    if (formRef && addPlayer.submissions()) {
      formRef.reset();
      firstNameRef.focus();
    }
  });
  return (
    <addPlayer.Form
      method="post"
      class="flex flex-col sm:flex-row sm:space-x-2 sm:space-y-0 space-y-2"
      ref={formRef!}
    >
      <input
        ref={firstNameRef!}
        name="firstName"
        placeholder="steph"
        class="border-gray-700 border-2 rounded-md px-2"
      />
      <input name="lastName" placeholder="curry" class="border-gray-700 border-2 rounded-md px-2" />
      <button class="focus:bg-gray-100 bg-gray-200 rounded-md px-2" type="submit">
        Add
      </button>
    </addPlayer.Form>
  );
}

const removePlayer = createForm(
  server(async (form: FormData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (Math.random() > 0.75) {
      throw new FormError("There was an error removing the player, please try again later");
    }

    await db.user.delete({
      where: {
        id: Number(form.get("id") as string)
      }
    });
    return redirect("/");
  })
);

function PlayerItem(props: { item: User }) {
  return (
    <ErrorBoundary fallback={(err, reset) => <div onClick={reset}>Error: {err.toString()}</div>}>
      <li
        class="list-circle py-1"
        style={{ color: removePlayer.submissions()[props.item.id]?.error ? "red" : "black" }}
      >
        <div class="text-lg inline-flex flex-row space-x-2">
          <span>
            {props.item.firstName} {props.item.lastName}
          </span>

          <removePlayer.Form method="post" key={props.item.id}>
            <input type="hidden" name="id" value={props.item.id} />
            <button class="bg-red-100 rounded-sm px-2 py-0 text-red-700">
              <Show when={!removePlayer.submissions()[props.item.id]?.error} fallback={"Retry"}>
                x
              </Show>
            </button>
          </removePlayer.Form>
        </div>
      </li>
    </ErrorBoundary>
  );
}

export default function Home() {
  const [data] = createResource(server(() => db.user.findMany()));

  return (
    <main class="w-full p-4 space-y-2">
      <h1 class="font-bold text-xl">Warriors Roster</h1>
      <Index each={data() ?? []}>
        {item => (
          <Show
            when={
              !removePlayer.submissions()[item()?.id] ||
              removePlayer.submissions()[item()?.id]?.status === "error"
            }
          >
            <PlayerItem item={item()} />
          </Show>
        )}
      </Index>
      <For
        each={Object.values(addPlayer.submissions()).filter(
          submission => submission.status !== "success"
        )}
      >
        {submission => <OptimisticPlayer submission={submission} />}
      </For>
      <AddPlayer />
    </main>
  );
}
