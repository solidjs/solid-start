import { createIslandReference } from "../server/islands";

async function fetchServerAction(base, id, args) {
  const response = await fetch(base, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "server-action": id
    },
    body: JSON.stringify(args)
  });

  return response.json();
}

export function createServerReference(fn, id, name) {
  return new Proxy(fn, {
    get(target, prop, receiver) {
    },
    apply(target, thisArg, args) {
      return fetchServerAction("/_server", `${id}#${name}`, args);
    }
  });
}

export function createClientReference(Component, id, name) {
  if (typeof Component === "function") {
    return createIslandReference(Component, id, name);
  }

  return Component;
}
