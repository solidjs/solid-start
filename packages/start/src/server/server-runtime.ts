import { type Component } from "solid-js";
import {
  deserializeJSONStream,
  deserializeJSStream,
  // serializeToJSONStream,
  serializeToJSONString,
} from "./serialization";
import { BODY_FORMAL_FILE, BODY_FORMAT_KEY, BodyFormat } from "./server-functions-shared";

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

function getHeadersAndBody(body: any): {
  headers?: HeadersInit;
  body: BodyInit;
} | undefined {
  switch (true) {
    case typeof body === "string":
      return {
        headers: {
          "Content-Type": "text/plain",
          [BODY_FORMAT_KEY]: BodyFormat.String,
        },
        body,
      };
    case body instanceof FormData:
      return {
        headers: {
          "Content-Type": "multipart/form-data",
          [BODY_FORMAT_KEY]: BodyFormat.FormData,
        },
        body,
      };
    case body instanceof URLSearchParams:
      return {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          [BODY_FORMAT_KEY]: BodyFormat.URLSearchParams,
        },
        body,
      };
    case body instanceof Blob:
      return {
        headers: {
          [BODY_FORMAT_KEY]: BodyFormat.Blob,
        },
        body,
      };
    case body instanceof File: {
      const formData = new FormData();
      formData.append(BODY_FORMAL_FILE, body, body.name);
      return {
        headers: {
          [BODY_FORMAT_KEY]: BodyFormat.File,
        },
        body: new FormData(),
      };
    }
    case body instanceof ArrayBuffer:
      return {
        headers: {
          [BODY_FORMAT_KEY]: BodyFormat.ArrayBuffer,
        },
        body,
      };
    case body instanceof Uint8Array:
      return {
        headers: {
          [BODY_FORMAT_KEY]: BodyFormat.Uint8Array,
        },
        body: new Uint8Array(body),
      };
    default:
      return undefined;
  }
}

async function initializeResponse(
  base: string,
  id: string,
  instance: string,
  options: RequestInit,
  args: any[],
) {
  // No args, skip serialization
  if (args.length === 0) {
    return createRequest(base, id, instance, options);
  }
  // For single arguments, we can directly encode as body
  if (args.length === 1) {
    const body = args[0];
    const result = getHeadersAndBody(body);
    if (result) {
      return createRequest(base, id, instance, {
        ...options,
        body: result.body,
        headers: {
          ...options.headers,
          ...result.headers,
        },
      });
    }
  }
  // Fallback to seroval
  return createRequest(base, id, instance, {
    ...options,
    // TODO(Alexis): move to serializeToJSONStream
    body: await serializeToJSONString(args),
    // duplex: 'half',
    // body: serializeToJSONStream(args),
    headers: {
      ...options.headers,
      "Content-Type": "text/plain",
      [BODY_FORMAT_KEY]: BodyFormat.Seroval,
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

  const response = await initializeResponse(base, id, instance, options, args);

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
  const clone = response.clone();
  let result;
  if (contentType?.startsWith("text/plain")) {
    result = await clone.text();
  } else if (contentType?.startsWith("application/json")) {
    result = await clone.json();
  } else if (response.headers.get(BODY_FORMAT_KEY)) {
    if (import.meta.env.SEROVAL_MODE === "js") {
      result = await deserializeJSStream(instance, clone);
    } else {
      result = await deserializeJSONStream(clone);
    }
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
