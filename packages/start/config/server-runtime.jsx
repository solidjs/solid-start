import { deserialize, toJSONAsync } from "seroval";
import { createIslandReference } from "../server/islands";

async function deserializeStream(response) {
  if (!response.body) {
    throw new Error('missing body');
  }
  const reader = response.body.getReader();

  async function pop() {
    const result = await reader.read();
    if (!result.done) {
      const serialized = new TextDecoder().decode(result.value);
      const splits = serialized.split('\n');
      for (const split of splits) {
        if (split !== '') {
          deserialize(split);
        }
      }
      await pop();
    }
  }

  const result = await reader.read();
  if (result.done) {
    throw new Error('Unexpected end of body');
  }
  const serialized = new TextDecoder().decode(result.value);
  const revived = deserialize(serialized);

  pop().catch(() => {
    // no-op
  });

  return revived;
}

let INSTANCE = 0;

async function fetchServerAction(base, id, args) {
  const response = await fetch(base, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "server-action": id
    },
    body: JSON.stringify({
      instance: `server-action:${INSTANCE++}`,
      args: await toJSONAsync(args),
    }),
  });
  if (response.ok) {
    return deserializeStream(response);
  }
  throw deserializeStream(response);
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
