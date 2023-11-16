import { createMemo, createSignal, For, Show } from "solid-js";
import { A, useLocation, useRouteData } from "solid-start";
import { createServerAction$, createServerData$, createServerMultiAction$, redirect } from "solid-start/server";
import { CompleteIcon, IncompleteIcon } from "~/components/icons";
import db from "~/db";
import { Todo } from "~/types";

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      setFocus: true;
    }
  }
}
const setFocus = (el: HTMLElement) => setTimeout(() => el.focus());

export const routeData = () => createServerData$(db.getTodos, { initialValue: [] });

const TodoApp = () => {
  const todos = useRouteData<typeof routeData>();
  const location = useLocation();

  const [addingTodo, addTodo] = createServerMultiAction$(addTodoFn);
  const [removingTodo, removeTodo] = createServerMultiAction$(removeTodoFn);
  const [togglingAll, toggleAll] = createServerAction$(toggleAllFn);
  const [, clearCompleted] = createServerAction$(clearCompletedFn);

  const [editingTodoId, setEditingId] = createSignal();
  const setEditing = ({ id, pending }: { id?: number; pending?: () => boolean }) => {
    if (!pending || !pending()) setEditingId(id);
  };
  const remainingCount = createMemo(
    () =>
      todos().length +
      addingTodo.pending.length -
      todos().filter(todo => todo.completed).length -
      removingTodo.pending.length
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
        <addTodo.Form onSubmit={e => {
          if (!inputRef.value.trim()) e.preventDefault();
          setTimeout(() => (inputRef.value = ""));
        }}>
          <input
            name="title"
            class="new-todo"
            placeholder="What needs to be done?"
            ref={inputRef}
            autofocus
          />
        </addTodo.Form>
      </header>

      <section class="main">
        <Show when={todos().length > 0}>
          <toggleAll.Form>
            <input name="completed" type="hidden" value={String(!remainingCount())} />
            <button class={`toggle-all ${!remainingCount() ? "checked" : ""}`} type="submit">
              ❯
            </button>
          </toggleAll.Form>
        </Show>
        <ul class="todo-list">
          <For each={filterList(todos())}>
            {todo => {
              const [togglingTodo, toggleTodo] = createServerAction$(toggleTodoFn);
              const [editingTodo, editTodo] = createServerAction$(editTodoFn);
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
              const removing = () => removingTodo.some(data => +data.input.get("id") === todo.id);
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
                      <toggleTodo.Form>
                        <input type="hidden" name="id" value={todo.id} />
                        <button type="submit" class="toggle" disabled={pending()}>
                          {completed() ? <CompleteIcon /> : <IncompleteIcon />}
                        </button>
                      </toggleTodo.Form>
                      <label onDblClick={[setEditing, { id: todo.id, pending }]}>{title()}</label>
                      <removeTodo.Form>
                        <input type="hidden" name="id" value={todo.id} />
                        <button type="submit" class="destroy" />
                      </removeTodo.Form>
                    </div>
                    <Show when={editingTodoId() === todo.id}>
                      <editTodo.Form onSubmit={() => setEditing({})}>
                        <input type="hidden" name="id" value={todo.id} />
                        <input
                          name="title"
                          class="edit"
                          value={todo.title}
                          onBlur={e => {
                            if (todo.title !== e.currentTarget.value) {
                              e.currentTarget.form.requestSubmit();
                            } else setEditing({});
                          }}
                          use:setFocus
                        />
                      </editTodo.Form>
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

      <Show when={todos().length || addingTodo.pending.length}>
        <footer class="footer">
          <span class="todo-count">
            <strong>{remainingCount()}</strong> {remainingCount() === 1 ? " item " : " items "} left
          </span>
          <ul class="filters">
            <li>
              <A href="?show=all" classList={{ selected: !location.query.show || location.query.show === "all" }}>
                All
              </A>
            </li>
            <li>
              <A href="?show=active" classList={{ selected: location.query.show === "active" }}>
                Active
              </A>
            </li>
            <li>
              <A href="?show=completed" classList={{ selected: location.query.show === "completed" }}>
                Completed
              </A>
            </li>
          </ul>
          <Show when={remainingCount() !== todos.length}>
            <clearCompleted.Form>
              <button class="clear-completed">Clear completed</button>
            </clearCompleted.Form>
          </Show>
        </footer>
      </Show>
    </section>
  );
};

async function addTodoFn(form: FormData) {
  await db.addTodo(form.get("title") as string);
  return redirect("/");
}
async function removeTodoFn(form: FormData) {
  await db.removeTodo(Number(form.get("id")));
  return redirect("/");
}
async function toggleAllFn(form: FormData) {
  await db.toggleAll(form.get("completed") === "true");
  return redirect("/");
}
async function clearCompletedFn(form: FormData) {
  await db.clearCompleted();
  return redirect("/");
}
async function toggleTodoFn(form: FormData) {
  await db.toggleTodo(Number(form.get("id")));
  return redirect("/");
}
async function editTodoFn(form: FormData) {
  await db.editTodo(Number(form.get("id")), String(form.get("title")));
  return redirect("/");
}

export default TodoApp;
