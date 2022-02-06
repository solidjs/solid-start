import { db } from "~/db";
import server, { redirect } from "solid-start/server";
import { FormError, createForm, FormSubmission } from "solid-start/form";
import { createEffect, createResource, ErrorBoundary, For, Index, Show } from "solid-js";
import { Prisma, Message, User } from "@prisma/client";
import { getUser, logout } from "~/session";

const sendMessage = createForm(
  server(async (form: FormData) => {
    const user = await getUser(server.getContext().request);

    if (!user) {
      throw new Error("Unauthenticated");
    }

    await new Promise(resolve => setTimeout(resolve, 2500));
    try {
      await db.message.create({
        data: {
          createdAt: new Date(),
          user: { connect: { id: user.id } },
          text: form.get("message") as string
        }
      });

      return redirect("/");
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        console.log(e); // The .code property can be accessed in a type-safe manner
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
      throw e;
    }
  })
);

function OptimisticMessage(props: { submission: FormSubmission }) {
  return (
    <li class="flex flex-row space-y-2">
      <div class="text-lg inline-flex flex-row items-center space-x-2">
        <span class="text-gray-500 font-bold">anonymous</span>
        <span>{props.submission.variables.get("message") as string}</span>
        {/* Retry form when there is an error with an add (switch firtname lastname for fun) */}
        <Show when={props.submission.error}>
          {error => (
            <>
              <span class="text-sm text-red-500">{error.message}</span>
              <sendMessage.Form key={props.submission.key}>
                <input
                  type="hidden"
                  value={props.submission.variables.get("message") as string}
                  name="message"
                />
                <button type="submit" class="bg-red-100 rounded-sm px-2 py-0 text-red-700">
                  Retry
                </button>
              </sendMessage.Form>
            </>
          )}
        </Show>
      </div>
    </li>
  );
}

const removeMessage = createForm(
  server(async (form: FormData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (Math.random() > 0.5) {
      throw new FormError("There was an error removing the player, please try again later");
    }

    await db.message.delete({
      where: {
        id: Number(form.get("id") as string)
      }
    });
    return redirect("/");
  })
);

function MessageItem(props: { item: Message & { user: User } }) {
  return (
    <ErrorBoundary fallback={(err, reset) => <div onClick={reset}>Error: {err.toString()}</div>}>
      <div
        class="py-1"
        style={{ color: removeMessage.submissions()[props.item.id]?.error ? "red" : "black" }}
      >
        <div class="text-lg inline-flex flex-row space-x-2">
          <span class="text-red-500 font-bold">{props.item.user.username}</span>
          <span>{props.item.text}</span>
          <removeMessage.Form method="post" key={props.item.id}>
            <input type="hidden" name="id" value={props.item.id} />
            <button class="bg-red-100 rounded-sm px-2 py-0 text-red-700">
              <Show when={!removeMessage.submissions()[props.item.id]?.error} fallback={"Retry"}>
                x
              </Show>
            </button>
          </removeMessage.Form>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default function Home() {
  const [data] = createResource(
    server(async () => {
      if (!(await getUser(server.getContext().request))) {
        throw redirect("/login");
      }

      return {
        messages: await db.message.findMany({
          include: {
            user: true
          }
        }),
        user: await getUser(server.getContext().request)
      };
    })
  );

  function MessageBox() {
    let formRef: HTMLFormElement;
    let firstNameRef: HTMLInputElement;

    createEffect(() => {
      if (formRef && sendMessage.submissions()) {
        formRef.reset();
        firstNameRef.focus();
      }
    });
    return (
      <sendMessage.Form
        method="post"
        class="flex flex-col sm:flex-row sm:space-x-2 sm:space-y-0 space-y-2"
        ref={formRef!}
      >
        <div class="flex flex flex-row">
          <span class="font-bold mr-2 text-blue-500">
            {data()?.user ? () => <span>{data()?.user.username}</span> : <span>anonymous</span>}
          </span>
          <input
            ref={firstNameRef!}
            name="message"
            placeholder="Hello!"
            class="border-gray-700 flex-1 border-2 rounded-md px-2"
          />
        </div>
        <button class="focus:bg-gray-100 bg-gray-200 rounded-md px-2" type="submit">
          Send
        </button>
      </sendMessage.Form>
    );
  }

  const logoutForm = createForm(
    server(async () => {
      return await logout(server.getContext().request);
    })
  );

  return (
    <main class="w-full p-4 space-y-2">
      <h1 class="font-bold text-xl">Message board</h1>
      <logoutForm.Form>
        <button type="submit">Logout</button>
      </logoutForm.Form>
      <Index each={data()?.messages ?? []}>
        {item => (
          <Show
            when={
              !removeMessage.submissions()[item()?.id] ||
              removeMessage.submissions()[item()?.id]?.status === "error"
            }
          >
            <MessageItem item={item()} />
          </Show>
        )}
      </Index>
      <For
        each={Object.values(sendMessage.submissions()).filter(
          submission => submission.status !== "success"
        )}
      >
        {submission => <OptimisticMessage submission={submission} />}
      </For>
      <MessageBox />
    </main>
  );
}
