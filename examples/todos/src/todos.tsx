import { createSignal, For, Show, Suspense } from "solid-js";
import { render } from "solid-js/web";

import {
  fetchTodos,
  addTodoMutation,
  removeTodoMutation,
  updateTodoMutation
} from "./fake-api";

import {
  action,
  useAction,
  useSubmission,
  useSubmissions,
  createLoader
} from "./data";

const addTodo = action(addTodoMutation);
const updateTodo = action(updateTodoMutation);
const removeTodo = action(removeTodoMutation);

const App = () => {
  const todos = createLoader(fetchTodos);
  const submitTodo = useAction(addTodo);
  const pendingTodos = useSubmissions(addTodo);
  const [newTitle, setNewTitle] = createSignal("");

  return (
    <>
      <h3>Todos Example {pendingTodos.pending && "..."}</h3>

      <Suspense fallback={"LOADING"}>
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="enter todo and click +"
            value={newTitle()}
            onInput={(e) => setNewTitle(e.currentTarget.value)}
          />
          <button
            onClick={() => {
              const title = newTitle().trim();
              if (!title) return;
              submitTodo(title);
              setNewTitle("");
            }}
          >
            +
          </button>
        </form>
        <For each={todos()}>
          {({ id, done, title }) => {
            const submitUpdate = useAction(updateTodo);
            const submitRemove = useAction(removeTodo);
            const updatingTodo = useSubmission(updateTodo, (s) => s.id === id);
            const removingTodo = useSubmission(removeTodo, (s) => s === id);
            return (
              <Show when={!removingTodo.pending}>
                <div>
                  <input
                    type="checkbox"
                    checked={done}
                    disabled={updatingTodo.pending}
                    onChange={(e) =>
                      submitUpdate({ id, done: e.currentTarget.checked })
                    }
                  />
                  <input
                    type="text"
                    value={title}
                    disabled={updatingTodo.pending}
                    onChange={(e) =>
                      submitUpdate({ id, title: e.currentTarget.value })
                    }
                  />
                  <button
                    disabled={updatingTodo.pending}
                    onClick={[submitRemove, id]}
                  >
                    x
                  </button>
                </div>
              </Show>
            );
          }}
        </For>
        <For each={pendingTodos}>
          {(sub) => (
            <div>
              <input type="checkbox" disabled />
              <input type="text" disabled value={sub.input} />
              <button disabled={!sub.error} onClick={sub.clear}>
                x
              </button>
              <Show when={sub.error}>
                <button onClick={sub.retry}>
                  <span role="img" aria-label="retry">
                    🔃
                  </span>
                </button>
                <span style="color: red">{sub.error.message}</span>
              </Show>
            </div>
          )}
        </For>
      </Suspense>
    </>
  );
};

render(App, document.getElementById("app"));
