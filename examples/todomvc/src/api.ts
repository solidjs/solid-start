import { redirect } from "@solidjs/router";
import { Todo } from "~/types";

let COUNTER = 0;
let TODOS: Todo[] = [];
const DELAY = 120;

function delay<T>(fn: () => T) {
  return new Promise<T>(res => setTimeout(() => res(fn()), DELAY));
}

export function getTodosFn() {
  return delay(() => TODOS);
}

export async function addTodoFn(formData: FormData) {
  const title = formData.get("title") as string;
  await delay(() => TODOS.push({ id: COUNTER++, title, completed: false }));
  return redirect("/");
}
export async function removeTodoFn(formData: FormData) {
  const id = Number(formData.get("id"));
  await delay(() => (TODOS = TODOS.filter(todo => todo.id !== id)));
  return redirect("/");
}

export async function toggleTodoFn(formData: FormData) {
  const id = Number(formData.get("id"));
  await delay(() =>
    TODOS.forEach((todo, index) => {
      if (todo.id === id) {
        TODOS[index] = { ...todo, completed: !todo.completed };
      }
    })
  );
  return redirect("/");
}

export async function editTodoFn(formData: FormData) {
  const id = Number(formData.get("id"));
  const title = String(formData.get("title"));
  await delay(() =>
    TODOS.forEach((todo, index) => {
      if (todo.id === id) {
        TODOS[index] = { ...todo, title };
      }
    })
  );
  return redirect("/");
}
export async function clearCompletedFn() {
  await delay(() => (TODOS = TODOS.filter(todo => !todo.completed)));
  return redirect("/");
}
export async function toggleAllFn(formData: FormData) {
  const completed = formData.get("completed") === "false";
  await delay(() =>
    TODOS.forEach((todo, index) => {
      TODOS[index] = { ...todo, completed };
    })
  );
  return redirect("/");
}
