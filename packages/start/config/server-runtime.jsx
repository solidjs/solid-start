import { deserialize, toJSONAsync } from "seroval";
import { createIslandReference } from "../server/islands";

async function deserializeStream(id, response) {
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

  pop().then(() => {
    delete self.$R[id];
  }, () => {
    // no-op
  });

  return revived;
}

let INSTANCE = 0;

async function fetchServerFunction(base, id, args) {
  const instance = `server-fn:${INSTANCE++}`;
  let response;
  if (args.length === 1 && args[0] instanceof FormData) {
    response = await fetch(base, {
      method: "POST",
      headers: {
        "server-fn": id,
        "server-fn-instance": instance
      },
      body: args[0]
    });
  } else {
    response = await fetch(base, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "server-fn": id,
        "server-fn-instance": instance
      },
      body: JSON.stringify(await toJSONAsync(args)),
    });
  }
  if (response.headers.get("Location")) throw response;
  const result = deserializeStream(instance, response);
  if (response.ok) {
    return result;
  }
  throw result;
}

export function createServerReference(fn, id, name) {
  return new Proxy(fn, {
    get(target, prop, receiver) {
      if (prop === "url") {
        return `/_server?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;
      }
    },
    apply(target, thisArg, args) {
      return fetchServerFunction("/_server", `${id}#${name}`, args);
    }
  });
}

export function createClientReference(Component, id, name) {
  if (typeof Component === "function") {
    return createIslandReference(Component, id, name);
  }

  return Component;
}
