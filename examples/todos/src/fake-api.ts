"use server";

export type Todo = {
  id: number;
  title: string;
  done: boolean;
};

let nextId = 2;
globalThis.TODOS = [
  { id: 1, title: "Make this demo", done: true },
  { id: 2, title: "Do something important", done: false }
];

// fake backend
function createDelay<T>(mutation: () => T) {
  return new Promise<T>((res, rej) =>
    setTimeout(() => {
      try {
        return res(mutation());
      } catch (err) {
        rej(err);
      }
    }, 500)
  );
}

export function fetchTodos() {
  return createDelay(() => TODOS);
}

export function addTodoMutation(title: string) {
  return createDelay(() => {
    if (Math.random() > 0.3) throw new Error("Random Error");
    const todo = { id: ++nextId, title, done: false };
    TODOS = [...TODOS, todo];
  });
}

export function updateTodoMutation(todoInfo: Partial<Todo>) {
  return createDelay(() => {
    TODOS = TODOS.map(t => {
      if (t.id !== todoInfo.id) return t;
      return { ...t, ...todoInfo };
    });
  });
}

export function removeTodoMutation(id: number) {
  return createDelay(() => {
    const index = TODOS.findIndex(t => t.id === id);
    TODOS = [...TODOS.slice(0, index), ...TODOS.slice(index + 1)];
  });
}
