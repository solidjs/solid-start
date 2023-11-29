"use server";

import { fileURLToPath } from "node:url";
import { createStorage } from "unstorage";
import fsLiteDriver from "unstorage/drivers/fs-lite";
import { Todo } from "~/types";

// this uses file system driver for unstorage that works only on node.js
// swap with the key value of your choice in your deployed environment
const storage = createStorage({
  driver: fsLiteDriver({
    base: "./.data"
  })
});
// storage.setItem("todos:data", []);
// storage.setItem("todos:counter", 0);

export async function getTodosFn() {
  return await storage.getItem("todos:data") as Todo[];
}
export async function addTodoFn(formData: FormData) {
  const title = formData.get("title") as string;
  const [{value: todos}, {value: index}] = await storage.getItems(["todos:data", "todos:counter"]);

  await Promise.all([
    storage.setItem("todos:data", [...todos as Todo[], { id: index as number, title, completed: false }]),
    storage.setItem("todos:counter", index as number + 1)
  ]);
}
export async function removeTodoFn(formData: FormData) {
  const id = Number(formData.get("id"));
  const todos = await storage.getItem("todos:data") as Todo[];
  await storage.setItem("todos:data", todos.filter(todo => todo.id !== id));
}
export async function toggleTodoFn(formData: FormData) {
  const id = Number(formData.get("id"));
  const todos = await storage.getItem("todos:data") as Todo[];
  await storage.setItem("todos:data", todos.map(todo => {
    if (todo.id === id) {
      todo.completed = !todo.completed;
    }
    return todo;
  }));
}
export async function editTodoFn(formData: FormData) {
  const id = Number(formData.get("id"));
  const title = String(formData.get("title"));
  const todos = await storage.getItem("todos:data") as Todo[];
  await storage.setItem("todos", todos.map(todo => {
    if (todo.id === id) {
      todo.title = title;
    }
    return todo;
  }));
}
export async function clearCompletedFn() {
  const todos = await storage.getItem("todos:data") as Todo[];
  await storage.setItem("todos:data", todos.filter(todo => !todo.completed));
}
export async function toggleAllFn(formData: FormData) {
  const completed = formData.get("completed") === "false";
  const todos = await storage.getItem("todos:data") as Todo[];
  await storage.setItem("todos:data", todos.map(todo => ({ ...todo, completed })));
}

// temporary hack
getTodosFn.url = `/_server?id=${encodeURIComponent(fileURLToPath(new URL(import.meta.url)))}&name=${getTodosFn.name}`
addTodoFn.url = `/_server?id=${encodeURIComponent(fileURLToPath(new URL(import.meta.url)))}&name=${addTodoFn.name}`
removeTodoFn.url = `/_server?id=${encodeURIComponent(fileURLToPath(new URL(import.meta.url)))}&name=${removeTodoFn.name}`
toggleTodoFn.url = `/_server?id=${encodeURIComponent(fileURLToPath(new URL(import.meta.url)))}&name=${toggleTodoFn.name}`
editTodoFn.url = `/_server?id=${encodeURIComponent(fileURLToPath(new URL(import.meta.url)))}&name=${editTodoFn.name}`
clearCompletedFn.url = `/_server?id=${encodeURIComponent(fileURLToPath(new URL(import.meta.url)))}&name=${clearCompletedFn.name}`
toggleAllFn.url = `/_server?id=${encodeURIComponent(fileURLToPath(new URL(import.meta.url)))}&name=${toggleAllFn.name}`
