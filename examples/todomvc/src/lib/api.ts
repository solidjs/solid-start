import { action, cache } from "@solidjs/router";
import type { Todo } from "~/types";
import { storage } from "./db";

export const getTodos = cache(async () => {
  "use server";
  return ((await storage.getItem("todos:data")) as Todo[]) || [];
}, "todos");

export const addTodo = action(async (formData: FormData) => {
  "use server";
  const title = formData.get("title") as string;
  let [{ value: todos }, { value: index }] = await storage.getItems([
    "todos:data",
    "todos:counter"
  ]);
  // default value for first write
  todos = todos || [];
  index = index || 0;

  await Promise.all([
    storage.setItem("todos:data", [
      ...(todos as Todo[]),
      { id: index as number, title, completed: false }
    ]),
    storage.setItem("todos:counter", (index as number) + 1)
  ]);
});

export const removeTodo = action(async (id: number) => {
  "use server";
  const todos = (await storage.getItem("todos:data")) as Todo[];
  await storage.setItem(
    "todos:data",
    todos.filter(todo => todo.id !== id)
  );
});

export const toggleTodo = action(async (id: number) => {
  "use server";
  const todos = (await storage.getItem("todos:data")) as Todo[];
  await storage.setItem(
    "todos:data",
    todos.map(todo => {
      if (todo.id === id) {
        todo.completed = !todo.completed;
      }
      return todo;
    })
  );
});

export const editTodo = action(async (id: number, formData: FormData) => {
  "use server";
  const title = String(formData.get("title"));
  const todos = (await storage.getItem("todos:data")) as Todo[];
  await storage.setItem(
    "todos:data",
    todos.map(todo => {
      if (todo.id === id) {
        todo.title = title;
      }
      return todo;
    })
  );
});

export const toggleAll = action(async (completed: boolean) => {
  "use server";
  const todos = (await storage.getItem("todos:data")) as Todo[];
  await storage.setItem(
    "todos:data",
    todos.map(todo => ({ ...todo, completed }))
  );
});

export const clearCompleted = action(async () => {
  "use server";
  const todos = (await storage.getItem("todos:data")) as Todo[];
  await storage.setItem(
    "todos:data",
    todos.filter(todo => !todo.completed)
  );
});
