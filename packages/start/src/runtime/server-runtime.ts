import { type Component } from "solid-js";
import { createIslandReference } from "../server/islands/index";
import {
  deserializeJSONStream,
  deserializeJSStream,
  serializeToJSONString,
} from "./serialization";

let INSTANCE = 0;

function createRequest(
  base: string,
  id: string,
  instance: string,
  options: RequestInit,
) {
  return fetch(base, {
    method: "POST",
    ...options,
    headers: {
      ...options.headers,
      "X-Server-Id": id,
      "X-Server-Instance": instance,
    },
  });
}

async function fetchServerFunction(
  base: string,
  id: string,
  options: Omit<RequestInit, "body">,
  args: any[],
) {
  const instance = `server-fn:${INSTANCE++}`;
  const response = await (args.length === 0
    ? createRequest(base, id, instance, options)
    : args.length === 1 && args[0] instanceof FormData
      ? createRequest(base, id, instance, { ...options, body: args[0] })
      : args.length === 1 && args[0] instanceof URLSearchParams
        ? createRequest(base, id, instance, {
          ...options,
          body: args[0],
          headers: {
            ...options.headers,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
        : createRequest(base, id, instance, {
          ...options,
          body: await serializeToJSONString(args),
          // duplex: 'half',
          // body: serializeToJSONStream(args),
          headers: {
            ...options.headers,
            "x-serialized": "true",
            "Content-Type": "text/plain"
          },
        }));

  if (
    response.headers.has("Location") ||
    response.headers.has("X-Revalidate") ||
    response.headers.has("X-Single-Flight")
  ) {
    if (response.body) {
      /* @ts-ignore-next-line */
      response.customBody = () => {
        if (import.meta.env.SEROVAL_MODE === "js") {
          return deserializeJSStream(instance, response.clone());
        }
        return deserializeJSONStream(response.clone());
      };
    }
    return response;
  }

  const contentType = response.headers.get("Content-Type");
  const cloned = response.clone();
  let result;
  if (contentType && contentType.startsWith("text/plain")) {
    result = await cloned.text();
  } else if (contentType && contentType.startsWith("application/json")) {
    result = await cloned.json();
  } else if (response.headers.get("x-serialized")) {
    if (import.meta.env.SEROVAL_MODE === "js") {
      result = await deserializeJSStream(instance, cloned);
    } else {
      result = await deserializeJSONStream(cloned);
    }
  }
  if (response.headers.has("X-Error")) {
    throw result;
  }
  return result;
}

export function createServerReference(fn: Function, id: string, name: string) {
  const baseURL = import.meta.env.SERVER_BASE_URL;
  return new Proxy(fn, {
    get(target, prop, receiver) {
      if (prop === "url") {
        return `${baseURL}/_server?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;
      }
      if (prop === "GET") {
        return receiver.withOptions({ method: "GET" });
      }
      if (prop === "withOptions") {
        const url = `${baseURL}/_server/?id=${encodeURIComponent(id)}&name=${encodeURIComponent(
          name,
        )}`;
        return (options: RequestInit) => {
          const fn = async (...args: any[]) => {
            const encodeArgs =
              options.method && options.method.toUpperCase() === "GET";
            return fetchServerFunction(
              encodeArgs
                ? url +
                (args.length
                  ? `&args=${encodeURIComponent(
                    await serializeToJSONString(args),
                  )}`
                  : "")
                : `${baseURL}/_server`,
              `${id}#${name}`,
              options,
              encodeArgs ? [] : args,
            );
          };
          fn.url = url;
          return fn;
        };
      }
      return (target as any)[prop];
    },
    apply(target, thisArg, args) {
      return fetchServerFunction(
        `${baseURL}/_server`,
        `${id}#${name}`,
        {},
        args,
      );
    },
  });
}

export function createClientReference(
  Component: Component<any>,
  id: string,
  name: string,
) {
  if (typeof Component === "function") {
    return createIslandReference(Component, id, name);
  }

  return Component;
}
