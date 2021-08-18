import { isServer } from "solid-js/web";

async function postData(url = "", body = {}) {
  const response = await fetch(url, {
    method: "POST",
    mode: "same-origin",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const { data } = await response.json();
  return data;
}

let actionProxy;
if (isServer) {
  const actionModules = import.meta.globEager("/src/actions/**/*.(js|ts)");
  actionProxy = Object.values<{ default: any }>(actionModules).reduce(
    (memo, actions) =>
      Object.assign(
        memo,
        Object.keys(actions.default).reduce((apis, actionName) => {
          apis[actionName] = (...args: any[]) => {
            return Promise.resolve(actions.default[actionName](...args));
          };
          return apis;
        }, {})
      ),
    {}
  );
} else {
  actionProxy = new Proxy(
    {},
    {
      get(_, property: string) {
        return (...args: any[]) => {
          return postData(`/actions/${property}`, args);
        };
      }
    }
  );
}

export default actionProxy;
