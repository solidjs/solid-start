import { createIslandReference } from "../server/island";

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
      console.log(target, prop);
    },
    apply(target, thisArg, args) {
      return fetchServerAction("/_server", `${id}#${name}`, args);
    }
  });
}

export function createClientReference(Component, id, name) {
  // function Island(props) {
  //   console.log(props);
  //   return <solid-island data-component={id}>{createComponent(Component, props)}</solid-island>;
  // }

  return createIslandReference(Component, id, name);
  // return new Proxy(fn, {
  //   get(target, prop, receiver) {
  //     console.log(target, prop);
  //   },
  //   apply(target, thisArg, args) {
  //     // console.log("Client references are not supported yet");
  //     // throw new Error("Client references are not supported yet");
  //   }
  // });
}
