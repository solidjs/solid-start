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
  const NAMESPACE = /([^\/\.]+)\.actions/;
  const actionModules = import.meta.globEager("/src/**/*.actions.(js|ts)");
  actionProxy = Object.entries<Record<string, any>>(actionModules).reduce(
    (memo, [name, actions]) => {
      memo[NAMESPACE.exec(name)[1]] = Object.keys(actions).reduce((apis, actionName) => {
        apis[actionName] = (...args: any[]) => Promise.resolve(actions[actionName](...args));
        return apis;
      }, {});
      return memo;
    },
    {}
  );
} else {
  actionProxy = new Proxy(
    {},
    {
      get(_, namespace: string) {
        return new Proxy(
          {},
          {
            get(_, property: string) {
              return (...args: any[]) => {
                return postData(`/actions/${namespace}/${property}`, args);
              };
            }
          }
        );
      }
    }
  );
}

export default actionProxy;
