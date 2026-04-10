import {
  RouteDefinition,
  useSubmissions,
  type RouteSectionProps,
} from "@solidjs/router";
import { For, Show, createMemo, createProjection, createSignal } from "solid-js";
import { CompleteIcon, IncompleteIcon } from "~/components/icons";
import {
  addTodo,
  clearCompleted,
  editTodo,
  getTodos,
  removeTodo,
  toggleAll,
  toggleTodo,
} from "~/lib/api";
import { Todo } from "~/types";

declare module "solid-js" {
  namespace JSX {
    interface ExplicitProperties { }
  }
}
const setFocus = () => (el: HTMLElement) => setTimeout(() => el.focus());

export const route = {
  preload() {
    getTodos();
  },
} satisfies RouteDefinition;

export default function TodoApp(props: RouteSectionProps) {
  const todos = createProjection(() => getTodos(), []);
  const location = props.location;

  const addingTodo = useSubmissions(addTodo);
  const removingTodo = useSubmissions(removeTodo);
  const togglingAllSubmissions = useSubmissions(toggleAll);
  const togglingAll = togglingAllSubmissions.at(-1);

  const [editingTodoId, setEditingId] = createSignal();
  const setEditing = ({ id, pending }: { id?: number; pending?: () => boolean }) => {
    if (!pending || !pending()) setEditingId(id);
  };
  const remainingCount = createMemo(
    () =>
      todos.length +
      addingTodo.length -
      todos.filter(todo => todo.completed).length -
      removingTodo.length,
  );
  const filterList = (todos: Todo[]) => {
    if (location.query.show === "active") return todos.filter(todo => !todo.completed);
    else if (location.query.show === "completed") return todos.filter(todo => todo.completed);
    else return todos;
  };

  let inputRef!: HTMLInputElement;
  return (
    <section class="todoapp">
      <header class="header">
        <h1>todos</h1>
        <form
          action={addTodo}
          method="post"
          onSubmit={e => {
            if (!inputRef.value.trim()) e.preventDefault();
            setTimeout(() => (inputRef.value = ""));
          }}
        >
          <input
            name="title"
            class="new-todo"
            placeholder="What needs to be done?"
            ref={inputRef}
            onInput={e => console.log({ e })}
            autofocus
          />
        </form>
      </header>

      <section class="main">
        <Show when={todos.length > 0}>
          <form action={toggleAll.with(!!remainingCount())} method="post">
            <button class={`toggle-all ${!remainingCount() ? "checked" : ""}`} type="submit">
              ❯
            </button>
          </form>
        </Show>
        <ul class="todo-list">
          <For each={filterList(todos as any)}>
            {todo => {
              const title = () => todo().title
              const completed = () => todo().completed;
              const removing = () => removingTodo.some(data => data.input[0] === todo().id);
              return (
                <Show when={!removing()}>
                  <li
                    class={["todo", {
                      editing: editingTodoId() === todo().id,
                      completed: completed(),
                    }]}
                  >
                    <form class="view" method="post">
                      <button
                        formaction={toggleTodo.with(todo().id)}
                        class="toggle"
                      >
                        <Show when={completed()} fallback={<IncompleteIcon />}><CompleteIcon /></Show>
                      </button>
                      <label onDblClick={[setEditing, { id: todo().id }]}>{title()}</label>
                      <button formaction={removeTodo.with(todo().id)} class="destroy" />
                    </form>
                    <Show when={editingTodoId() === todo().id}>
                      <form
                        action={editTodo.with(todo().id)}
                        method="post"
                        onSubmit={e => {
                          e.preventDefault();
                          setTimeout(() => setEditing({}));
                        }}
                      >
                        <input
                          name="title"
                          class="edit"
                          value={todo().title}
                          onBlur={e => {
                            if (todo().title !== e.currentTarget.value) {
                              e.currentTarget.form!.requestSubmit();
                            } else setTimeout(() => setEditing({}));
                          }}
                          ref={setFocus()}
                        />
                      </form>
                    </Show>
                  </li>
                </Show>
              );
            }}
          </For>
          <For each={addingTodo}>
            {sub => (
              <li class="todo pending">
                <div class="view">
                  <label>{String(sub().input[0].get("title"))}</label>
                  <button disabled class="destroy" />
                </div>
              </li>
            )}
          </For>
        </ul>
      </section>

      <Show when={todos.length + addingTodo.length - removingTodo.length}>
        <footer class="footer">
          <span class="todo-count">
            <strong>{remainingCount()}</strong> {remainingCount() === 1 ? " item " : " items "} left
          </span>
          <ul class="filters">
            <li>
              <a
                href="?show=all"
                class={{ selected: !location.query.show || location.query.show === "all" }}
              >
                All
              </a>
            </li>
            <li>
              <a href="?show=active" class={{ selected: location.query.show === "active" }}>
                Active
              </a>
            </li>
            <li>
              <a
                href="?show=completed"
                class={{ selected: location.query.show === "completed" }}
              >
                Completed
              </a>
            </li>
          </ul>
          <Show when={remainingCount() !== todos.length}>
            <form action={clearCompleted} method="post">
              <button class="clear-completed">Clear completed</button>
            </form>
          </Show>
        </footer>
      </Show>
    </section >
  );
}
