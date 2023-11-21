import { createIslandReference } from "../server/islands";

async function fetchServerAction(base, id, args) {
  const response = await fetch(base, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "server-action": id
    },
    body: JSON.stringify(args)
  });

  const json = await response.json();

  if (response.status === 200) {
    return json;
  } else {
    console.log(json);
    throw { message: json.error };
  }
}

export function createServerReference(fn, id, name) {
  return new Proxy(fn, {
    get(target, prop, receiver) {
      if (prop === "url") {
        return `/_server?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;
      }
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
