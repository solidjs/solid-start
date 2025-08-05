import { useQuery } from "@rocicorp/zero/solid";
import { action } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";
import { useZero } from "~/components/zero-context";
import { useCachedSession } from "~/lib/use-cached-session";

export default function Home() {
  const session = useCachedSession();
  const userId = () => session.data?.user.id ?? "anon";
  const z = useZero();
  const [editingTodo, setEditingTodo] = createSignal<string | null>(null);
  let inputRef: HTMLInputElement | undefined;

  const [todosList] = useQuery(() =>
    z().query.todos.where("userId", "=", userId()).orderBy("createdAt", "desc")
  );

  const addTodo = action(async (formData: FormData) => {
    const newTodo = formData.get("newTodo") as string;
    if (!newTodo?.trim()) return;
    await z().mutate.todos.insert({
      id: crypto.randomUUID(),
      userId: userId(),
      title: newTodo,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    if (inputRef) inputRef.value = "";
  }, "add-todo");

  const editTodo = action(async (formData: FormData) => {
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    if (!title.trim()) return;
    await z().mutate.todos.update({
      id,
      title,
      updatedAt: Date.now()
    });
    setEditingTodo(null);
  });

  const updateTodoStatus = async (id: string, status: "active" | "done") => {
    await z().mutate.todos.update({
      id,
      status,
      updatedAt: Date.now()
    });
  };

  const deleteTodo = async (id: string) => {
    await z().mutate.todos.delete({ id });
  };

  return (
    <main class="mx-auto p-4 text-center text-gray-700">
      <h1 class="max-6-xs my-16 font-thin text-6xl text-sky-700 uppercase">Todos</h1>
      <div class="mx-auto mt-8 max-w-200 accent-sky-700">
        <form action={addTodo} method="post" class="mt-4 flex justify-center">
          <input
            type="text"
            name="newTodo"
            ref={inputRef}
            placeholder="New Todo"
            class="grow rounded-lg border p-2 shadow-sm"
          />
          <button
            type="submit"
            class="ml-2 rounded-lg bg-sky-700 p-2 text-white shadow-md hover:bg-sky-800"
          >
            Add Todo
          </button>
        </form>

        <ul class="mt-4 grid gap-2">
          <For each={todosList()}>
            {todo => (
              <li class="flex items-center rounded-lg bg-white p-2 shadow-sm">
                <Show
                  when={editingTodo() !== todo.id}
                  fallback={
                    <form action={editTodo} method="post" class="flex w-full items-center">
                      <input type="hidden" name="id" value={todo.id} />
                      <input
                        type="text"
                        name="title"
                        value={todo.title}
                        onKeyDown={e => {
                          if (e.key === "Escape") {
                            setEditingTodo(null);
                          }
                        }}
                        class="grow rounded-lg border p-2 shadow-sm"
                      />
                      <button
                        type="submit"
                        class="ml-2 rounded-lg bg-sky-700 p-2 text-white shadow-md hover:bg-sky-800"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTodo(null)}
                        class="ml-2 rounded-lg border border-sky-700 p-2 text-sky-700"
                      >
                        Cancel
                      </button>
                    </form>
                  }
                >
                  <input
                    type="checkbox"
                    checked={todo.status === "done"}
                    class="mr-2"
                    onChange={() => {
                      updateTodoStatus(todo.id, todo.status === "active" ? "done" : "active");
                    }}
                  />
                  <span
                    classList={{
                      "line-through": todo.status === "done"
                    }}
                    class="grow text-start"
                  >
                    {todo.title}
                  </span>
                  <div>
                    <button
                      type="button"
                      onClick={() => setEditingTodo(todo.id)}
                      class="mx-2 rounded-lg border border-sky-700 p-2 text-sky-700 hover:border-sky-800 hover:text-sky-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTodo(todo.id)}
                      class="rounded-lg border border-red-700 p-2 text-red-700 hover:border-red-800 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </Show>
              </li>
            )}
          </For>
        </ul>
      </div>
    </main>
  );
}
