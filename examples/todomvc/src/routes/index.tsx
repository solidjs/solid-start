import {
  action,
  cache,
  createAsync,
  useSubmission,
  useSubmissions,
  type RouteSectionProps
} from "@solidjs/router";
import { For, Show, createMemo, createSignal } from "solid-js";
import { CompleteIcon, IncompleteIcon } from "~/components/icons";
import {
  addTodoFn,
  clearCompletedFn,
  editTodoFn,
  getTodosFn,
  removeTodoFn,
  toggleAllFn,
  toggleTodoFn
} from "~/lib/api";
import { Todo } from "~/types";

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      setFocus: true;
    }
  }
}
const setFocus = (el: HTMLElement) => setTimeout(() => el.focus());
const getTodos = cache(getTodosFn, "todos");
const addTodo = action(addTodoFn, "addTodo");
const removeTodo = action(removeTodoFn, "removeTodo");
const toggleAll = action(toggleAllFn, "toggleAll");
const clearCompleted = action(clearCompletedFn, "clearCompleted");
const editTodo = action(editTodoFn, "editTodo");
const toggleTodo = action(toggleTodoFn, "toggleTodo");

export default function TodoApp(props: RouteSectionProps) {
  const todos = createAsync(getTodos, { initialValue: [], deferStream: true });
  const location = props.location;

  const addingTodo = useSubmissions(addTodo);
  const removingTodo = useSubmissions(removeTodo);
  const togglingAll = useSubmission(toggleAll);

  const [editingTodoId, setEditingId] = createSignal();
  const setEditing = ({ id, pending }: { id?: number; pending?: () => boolean }) => {
    if (!pending || !pending()) setEditingId(id);
  };
  const remainingCount = createMemo(
    () =>
      todos().length +
      addingTodo.length -
      todos().filter(todo => todo.completed).length -
      removingTodo.length
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
            autofocus
          />
        </form>
      </header>

      <section class="main">
        <Show when={todos().length > 0}>
          <form action={toggleAll} method="post">
            <input name="completed" type="hidden" value={String(!remainingCount())} />
            <button class={`toggle-all ${!remainingCount() ? "checked" : ""}`} type="submit">
              ❯
            </button>
          </form>
        </Show>
        <ul class="todo-list">
          <For each={filterList(todos())}>
            {todo => {
              const togglingTodo = useSubmission(toggleTodo, f => Number(f.get("id")) == todo.id);
              const editingTodo = useSubmission(editTodo, f => Number(f.get("id")) == todo.id);
              const title = () =>
                editingTodo.pending ? (editingTodo.input.get("title") as string) : todo.title;
              const pending = () =>
                togglingAll.pending || togglingTodo.pending || editingTodo.pending;
              const completed = () =>
                togglingAll.pending
                  ? !togglingAll.input.get("completed")
                  : togglingTodo.pending
                  ? !togglingTodo.input.get("completed")
                  : todo.completed;
              const removing = () =>
                removingTodo.some(data => Number(data.input.get("id")) === todo.id);
              return (
                <Show when={!removing()}>
                  <li
                    class="todo"
                    classList={{
                      editing: editingTodoId() === todo.id,
                      completed: completed(),
                      pending: pending()
                    }}
                  >
                    <div class="view">
                      <form action={toggleTodo} method="post">
                        <input type="hidden" name="id" value={todo.id} />
                        <button type="submit" class="toggle" disabled={pending()}>
                          {completed() ? <CompleteIcon /> : <IncompleteIcon />}
                        </button>
                      </form>
                      <label onDblClick={[setEditing, { id: todo.id, pending }]}>{title()}</label>
                      <form action={removeTodo} method="post">
                        <input type="hidden" name="id" value={todo.id} />
                        <button type="submit" class="destroy" />
                      </form>
                    </div>
                    <Show when={editingTodoId() === todo.id}>
                      <form action={editTodo} method="post" onSubmit={() => setEditing({})}>
                        <input type="hidden" name="id" value={todo.id} />
                        <input
                          name="title"
                          class="edit"
                          value={todo.title}
                          onBlur={e => {
                            if (todo.title !== e.currentTarget.value) {
                              e.currentTarget.form!.requestSubmit();
                            } else setEditing({});
                          }}
                          use:setFocus
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
                  <label>{sub.input.get("title") as string}</label>
                  <button disabled class="destroy" />
                </div>
              </li>
            )}
          </For>
        </ul>
      </section>

      <Show when={todos().length || addingTodo.length}>
        <footer class="footer">
          <span class="todo-count">
            <strong>{remainingCount()}</strong> {remainingCount() === 1 ? " item " : " items "} left
          </span>
          <ul class="filters">
            <li>
              <a href="?show=all" classList={{ selected: !location.query.show || location.query.show === "all" }}>
                All
              </a>
            </li>
            <li>
              <a href="?show=active" classList={{ selected: location.query.show === "active" }}>
                Active
              </a>
            </li>
            <li>
              <a href="?show=completed" classList={{ selected: location.query.show === "completed" }}>
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
    </section>
  );
}
