import { db } from "~/db";
import server, { redirect } from "solid-start/server";
import { FormError, createForm, FormSubmission } from "solid-start/form";
import { createEffect, createResource, For, Index, Show, useContext } from "solid-js";
import { Prisma, Message, User } from "@prisma/client";
import { getUser, logout } from "~/db/session";
import { StartContext, StartProvider } from "solid-start/components";
import { useRouteData, useParams, useSearchParams } from "solid-app-router";
import ErrorBoundary from "solid-start/server/ErrorBoundary";

const sendMessage = createForm(
  server(async (ctx, form: FormData) => {
    const user = await getUser(ctx);

    if (Math.random() > 0.75) {
      throw new FormError("There was an error adding the messages, please try again");
    }

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
      throw e;
    }
  })
);

export function OptimisticMessage(props: { submission: FormSubmission }) {
  const [data] = useRouteData<ReturnType<typeof routeData>>();
  return (
    <li class="flex flex-row space-y-2">
      <div class="text-lg inline-flex flex-row items-center space-x-2">
        <span class="text-gray-500 font-bold">{data()?.user.username}</span>
        <span>{props.submission.variables.formData.get("message") as string}</span>
        {/* Retry form when there is an error with an add (switch firtname lastname for fun) */}
        <Show when={props.submission.error}>
          {error => (
            <>
              <span class="text-sm text-red-500">{error.message}</span>
              <sendMessage.Form key={props.submission.key}>
                <input
                  type="hidden"
                  value={props.submission.variables.formData.get("message") as string}
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
  server(async (ctx, form: FormData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (Math.random() > 0.75) {
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
            {/* <Show when={!removeMessage.submissions()[props.item.id]?.error} fallback={"Retry"}> */}
            x{/* </Show> */}
          </button>
        </removeMessage.Form>
      </div>
    </div>
  );
}

export function routeData() {
  return createResource(
    server(async function () {
      console.log(this.request.headers.get("cookie"));
      if (!(await getUser(this.request))) {
        throw redirect("/login", {
          context: this
        });
      }

      return {
        messages: await db.message.findMany({
          include: {
            user: true
          }
        }),
        user: await getUser(this.request)
      };
    })
  );
}

export default function Home() {
  const [data] = useRouteData<ReturnType<typeof routeData>>();

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
        <label htmlFor="message" class="flex flex flex-row">
          <span class="font-bold mr-2 text-blue-500">
            {data()?.user ? () => <span>{data()?.user.username}</span> : <span>anonymous</span>}
          </span>
        </label>
        <input
          ref={firstNameRef!}
          name="message"
          placeholder="Hello!"
          class="border-gray-700 flex-1 border-2 rounded-md px-2"
        />
        <button class="focus:bg-gray-100 bg-gray-200 rounded-md px-2" type="submit" id="sends">
          Send
        </button>
      </sendMessage.Form>
    );
  }

  const logoutForm = createForm(
    server(async function () {
      return await logout(this.request);
    })
  );

  return (
    <main class="w-full p-4 space-y-2">
      <h1 class="font-bold text-xl">Message board</h1>
      <logoutForm.Form>
        <button name="logout" type="submit">
          Logout
        </button>
      </logoutForm.Form>
      <ErrorBoundary>
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
      </ErrorBoundary>
    </main>
  );
}
