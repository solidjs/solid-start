import { fromCrossJSON, toJSONAsync } from "seroval";
import { createIslandReference } from "../server/islands";

async function fetchServerAction(base, id, args) {
  const response = await fetch(base, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "server-action": id
    },
    body: JSON.stringify(await toJSONAsync(args)),
  });

  const refs = new Map();
  const decoder = new TextDecoder();

  const reader = response.body.getReader();

  async function pop() {
    const bytes = await reader.read();
    if (bytes.done) {
      return undefined;
    }
    // The rest are parsed non-blockingly
    pop();
    const serialized = decoder.decode(bytes.value);
    const parsed = JSON.parse(serialized);
    return fromCrossJSON(parsed, {
      refs,
    });
  }

  return pop();
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
