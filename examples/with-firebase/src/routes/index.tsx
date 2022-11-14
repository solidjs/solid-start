import { createEffect, For } from "solid-js";
import { useRouteData } from "solid-start";
import {
  createServerData$,
  createServerMultiAction$,
  redirect,
} from "solid-start/server";
import authController from "~/application/auth/auth_controller";
import serverDataController from "~/application/server_data/server_data_controller";

export const routeData = () =>
  createServerData$(
    async () => {
      const user = await authController.getCurrentUser();
      if (!user) {
        throw redirect("/login");
      }
      const serverData = await serverDataController.getServerDatas();
      return serverData;
    },
    { key: () => ["server_data"] }
  );

export default function Page() {
  const severData = useRouteData<typeof routeData>();

  let inputRef: HTMLInputElement;
  const [addingStuff, addingStuffAction] = createServerMultiAction$(
    async (formData: FormData) => {
      const text = formData.get("text") as string;
      serverDataController.writeServerData({ text });
      return redirect("/");
    }
  );

  const [_, logoutAction] = createServerMultiAction$(async (_: FormData) => {
    authController.logout();
    return redirect("/login");
  });

  createEffect(() => {
    // Clear input field after submit
    if (inputRef && addingStuff.pending) {
      inputRef.value = "";
    }
  });

  if (severData.error) {
    return <p>Error</p>;
  }

  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <div class="p-3">
        <ul class="space-y-1 max-w-md list-disc list-inside text-gray-500 dark:text-gray-400">
          <For each={severData()}>
            {(item) => <li class="m-5">{item.text}</li>}
          </For>
        </ul>
      </div>
      <addingStuffAction.Form>
        <label for="username">Text:</label>
        <input
          ref={inputRef}
          type="text"
          name="text"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        />
        <button
          type="submit"
          value="submit"
          class="text-white m-2 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Send Server Data
        </button>
      </addingStuffAction.Form>
      <logoutAction.Form>
        <button
          type="submit"
          class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Logout
        </button>
      </logoutAction.Form>
    </main>
  );
}
