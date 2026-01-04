// @ts-ignore - seroval exports issue with NodeNext
import { type Component } from "solid-js";
import {
  deserializeJSONStream,
  deserializeJSStream,
  serializeToJSONStream,
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
          body: serializeToJSONStream(args),
          headers: { ...options.headers, "Content-Type": "application/json" },
        }));

  if (
    response.headers.has("Location") ||
    response.headers.has("X-Revalidate") ||
    response.headers.has("X-Single-Flight")
  ) {
    if (response.body) {
      /* @ts-ignore-next-line */
      response.customBody = () => {
        // TODO check for serialization mode
        return deserializeJSStream(instance, response);
      };
    }
    return response;
  }

  const contentType = response.headers.get("Content-Type");
  let result;
  if (contentType && contentType.startsWith("text/plain")) {
    result = await response.text();
  } else if (contentType && contentType.startsWith("application/json")) {
    result = await response.json();
  } else if (import.meta.env.SEROVAL_MODE === "js") {
    // TODO check for serialization mode
    result = await deserializeJSStream(instance, response);
  } else {
    result = await deserializeJSONStream(response);
  }
  if (response.headers.has("X-Error")) {
    throw result;
  }
  return result;
}

export function createServerReference(id: string) {
  let baseURL = import.meta.env.BASE_URL ?? "/";
  if (!baseURL.endsWith("/")) baseURL += "/";

  const fn = (...args: any[]) =>
    fetchServerFunction(`${baseURL}_server`, id, {}, args);

  return new Proxy(fn, {
    get(target, prop, receiver) {
      if (prop === "url") {
        return `${baseURL}_server?id=${encodeURIComponent(id)}`;
      }
      if (prop === "GET") {
        return receiver.withOptions({ method: "GET" });
      }
      if (prop === "withOptions") {
        const url = `${baseURL}_server?id=${encodeURIComponent(id)}`;
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
                : `${baseURL}_server`,
              id,
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
  });
}

export function createClientReference(Component: Component<any>, id: string) {
  return Component;
}
