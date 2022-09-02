// TODO: This is terribly broken with HMR. Should use real persistent storage.
import { Todo } from "~/types";

let COUNTER = 0;
let TODOS: Todo[] = [];
const DELAY = 120;

function delay<T>(fn: () => T) {
  return new Promise<T>((res) => setTimeout(() => res(fn()), DELAY));
}

export default {
  getTodos() {
    return delay(() => TODOS);
  },
  addTodo(title: string) {
    return delay(() => TODOS.push({ id: COUNTER++, title, completed: false }));
  },
  removeTodo(id: number) {
    return delay(() => (TODOS = TODOS.filter((todo) => todo.id !== id)));
  },
  toggleTodo(id: number) {
    return delay(() =>
      TODOS.forEach(
        (todo) => todo.id === id && (todo.completed = !todo.completed)
      )
    );
  },
  editTodo(id: number, title: string) {
    return delay(() =>
      TODOS.forEach((todo) => {
        if (todo.id === id) todo.title = title;
      })
    );
  },
  clearCompleted() {
    return delay(() => (TODOS = TODOS.filter((todo) => !todo.completed)));
  },
  toggleAll(completed: boolean) {
    return delay(() => TODOS.forEach((todo) => (todo.completed = !completed)));
  },
};
