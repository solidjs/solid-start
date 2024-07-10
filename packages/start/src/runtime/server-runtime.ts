import { deserialize, toJSONAsync } from "seroval";
import {
  CustomEventPlugin,
  DOMExceptionPlugin,
  EventPlugin,
  FormDataPlugin,
  HeadersPlugin,
  ReadableStreamPlugin,
  RequestPlugin,
  ResponsePlugin,
  URLPlugin,
  URLSearchParamsPlugin
} from "seroval-plugins/web";
import { type Component } from "solid-js";
import { createIslandReference } from "../server/islands/index";

class SerovalChunkReader {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  buffer: Uint8Array;
  done: boolean;
  constructor(stream: ReadableStream<Uint8Array>) {
    this.reader = stream.getReader();
    this.buffer = new Uint8Array(0);
    this.done = false;
  }

  async readChunk() {
    // if there's no chunk, read again
    const chunk = await this.reader.read();
    if (!chunk.done) {
      // repopulate the buffer
      let newBuffer = new Uint8Array(this.buffer.length + chunk.value.length);
      newBuffer.set(this.buffer);
      newBuffer.set(chunk.value, this.buffer.length);
      this.buffer = newBuffer;
    } else {
      this.done = true;
    }
  }

  async next(): Promise<any> {
    // Check if the buffer is empty
    if (this.buffer.length === 0) {
      // if we are already done...
      if (this.done) {
        return {
          done: true,
          value: undefined
        };
      }
      // Otherwise, read a new chunk
      await this.readChunk();
      return await this.next();
    }
    // Read the "byte header"
    // The byte header tells us how big the expected data is
    // so we know how much data we should wait before we
    // deserialize the data
    const head = new TextDecoder().decode(this.buffer.subarray(1, 11));
    const bytes = Number.parseInt(head, 16); // ;0x00000000;
    // Check if the buffer has enough bytes to be parsed
    while (bytes > this.buffer.length - 12) {
      // If it's not enough, and the reader is done
      // then the chunk is invalid.
      if (this.done) {
        throw new Error("Malformed server function stream.");
      }
      // Otherwise, we read more chunks
      await this.readChunk();
    }
    // Extract the exact chunk as defined by the byte header
    const partial = new TextDecoder().decode(this.buffer.subarray(12, 12 + bytes));
    // The rest goes to the buffer
    this.buffer = this.buffer.subarray(12 + bytes);

    // Deserialize the chunk
    return {
      done: false,
      value: deserialize(partial)
    };
  }

  async drain() {
    while (true) {
      const result = await this.next();
      if (result.done) {
        break;
      }
    }
  }
}

async function deserializeStream(id: string, response: Response) {
  if (!response.body) {
    throw new Error("missing body");
  }
  const reader = new SerovalChunkReader(response.body);

  const result = await reader.next();

  if (!result.done) {
    reader.drain().then(
      () => {
        // @ts-ignore
        delete $R[id];
      },
      () => {
        // no-op
      }
    );
  }

  return result.value;
}

let INSTANCE = 0;

function createRequest(base: string, id: string, instance: string, options: RequestInit) {
  return fetch(base, {
    method: "POST",
    ...options,
    headers: {
      ...options.headers,
      "X-Server-Id": id,
      "X-Server-Instance": instance
    }
  });
}

const plugins = [
  CustomEventPlugin,
  DOMExceptionPlugin,
  EventPlugin,
  FormDataPlugin,
  HeadersPlugin,
  ReadableStreamPlugin,
  RequestPlugin,
  ResponsePlugin,
  URLSearchParamsPlugin,
  URLPlugin
];

async function fetchServerFunction(
  base: string,
  id: string,
  options: Omit<RequestInit, "body">,
  args: any[]
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
        headers: { ...options.headers, "Content-Type": "application/x-www-form-urlencoded" }
      })
    : createRequest(base, id, instance, {
        ...options,
        body: JSON.stringify(await Promise.resolve(toJSONAsync(args, { plugins }))),
        headers: { ...options.headers, "Content-Type": "application/json" }
      }));

  if (
    response.headers.get("Location") ||
    response.headers.get("X-Revalidate") ||
    response.headers.get("X-Single-Flight")
  ) {
    if (response.body) {
      /* @ts-ignore-next-line */
      response.customBody = () => {
        return deserializeStream(instance, response);
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
  } else {
    result = await deserializeStream(instance, response);
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
          name
        )}`;
        return (options: RequestInit) => {
          const fn = async (...args: any[]) => {
            const encodeArgs = options.method && options.method.toUpperCase() === "GET";
            return fetchServerFunction(
              encodeArgs
                ? url +
                    (args.length
                      ? `&args=${encodeURIComponent(
                          JSON.stringify(await Promise.resolve(toJSONAsync(args, { plugins })))
                        )}`
                      : "")
                : `${baseURL}/_server`,
              `${id}#${name}`,
              options,
              encodeArgs ? [] : args
            );
          };
          fn.url = url;
          return fn;
        };
      }
      return (target as any)[prop];
    },
    apply(target, thisArg, args) {
      return fetchServerFunction(`${baseURL}/_server`, `${id}#${name}`, {}, args);
    }
  });
}

export function createClientReference(Component: Component<any>, id: string, name: string) {
  if (typeof Component === "function") {
    return createIslandReference(Component, id, name);
  }

  return Component;
}
