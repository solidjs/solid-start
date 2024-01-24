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
import { createIslandReference } from "../server/islands";

class SerovalChunkReader {
  constructor(stream) {
    this.reader = stream.getReader();
    this.buffer = "";
    this.done = false;
  }

  async readChunk() {
    // if there's no chunk, read again
    const chunk = await this.reader.read();
    if (!chunk.done) {
      // repopulate the buffer
      this.buffer += new TextDecoder().decode(chunk.value);
    } else {
      this.done = true;
    }
  }

  async next() {
    // Check if the buffer is empty
    if (this.buffer === "") {
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
    const bytes = Number.parseInt(this.buffer.substring(1, 11), 16); // ;0x00000000;
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
    const partial = this.buffer.substring(12, 12 + bytes);
    // The rest goes to the buffer
    this.buffer = this.buffer.substring(12 + bytes);
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

async function deserializeStream(id, response) {
  if (!response.body) {
    throw new Error("missing body");
  }
  const reader = new SerovalChunkReader(response.body);

  const result = await reader.next();

  if (!result.done) {
    reader.drain().then(
      () => {
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

function createRequest(base, id, instance, body, contentType) {
  return fetch(base, {
    method: "POST",
    headers: {
      "x-server-id": id,
      "x-server-instance": instance,
      ...(contentType ? { "Content-Type": contentType } : {})
    },
    body
  });
}

async function fetchServerFunction(base, id, method, args) {
  const instance = `server-fn:${INSTANCE++}`;
  const response = await (method === "GET"
    ? fetch(base + (args.length ? `&args=${JSON.stringify(args)}` : ""), {
        headers: {
          "x-server-instance": instance
        }
      })
    : args.length === 1 && args[0] instanceof FormData
    ? createRequest(base, id, instance, args[0])
    : createRequest(
        base,
        id,
        instance,
        JSON.stringify(
          await Promise.resolve(
            toJSONAsync(args, {
              plugins: [
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
              ]
            })
          )
        ),
        "application/json"
      ));

  if (response.headers.get("Location")) throw response;
  if (response.headers.get("X-Revalidate")) {
    /* ts-ignore-next-line */
    response.customBody = () => {
      return deserializeStream(instance, response);
    };
    throw response;
  }
  const contentType = response.headers.get("Content-Type");
  let result;
  if (contentType && contentType.startsWith("text/plain")) {
    result = await response.text();
  } else if (contentType && contentType.startsWith("application/json")) {
    result = await response.json();
  } else {
    result = deserializeStream(instance, response);
  }
  if (response.ok) {
    return result;
  }
  throw result;
}

export function createServerReference(fn, id, name) {
  const baseURL = import.meta.env.SERVER_BASE_URL;
  return new Proxy(fn, {
    get(target, prop, receiver) {
      if (prop === "url") {
        return `${baseURL}/_server?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;
      }
      if (prop === "GET") {
        return (...args) => fetchServerFunction(`${baseURL}/_server/?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`, `${id}#${name}`, "GET", args);
      }
    },
    apply(target, thisArg, args) {
      return fetchServerFunction(`${baseURL}/_server`, `${id}#${name}`, "POST", args);
    }
  });
}

export function createClientReference(Component, id, name) {
  if (typeof Component === "function") {
    return createIslandReference(Component, id, name);
  }

  return Component;
}
