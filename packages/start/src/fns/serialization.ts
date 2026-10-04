import {
  crossSerializeStream,
  deserialize,
  Feature,
  fromCrossJSON,
  getCrossReferenceHeader,
  isStream,
  type SerovalNode,
  toCrossJSONStream,
} from "seroval";
import {
  AbortSignalPlugin,
  CustomEventPlugin,
  DOMExceptionPlugin,
  EventPlugin,
  FormDataPlugin,
  HeadersPlugin,
  ReadableStreamPlugin,
  RequestPlugin,
  ResponsePlugin,
  URLPlugin,
  URLSearchParamsPlugin,
} from "seroval-plugins/web";
import userPlugins from "solid-start:seroval-plugins";

const DEFAULT_PLUGINS = [
  AbortSignalPlugin,
  CustomEventPlugin,
  DOMExceptionPlugin,
  EventPlugin,
  FormDataPlugin,
  HeadersPlugin,
  ReadableStreamPlugin,
  RequestPlugin,
  ResponsePlugin,
  URLSearchParamsPlugin,
  URLPlugin,
];

/**
 * Plugins from `serialization.plugins` are appended rather than prepended:
 * seroval picks the first plugin whose `test()` passes, so the built-ins win
 * and a loose user `test()` can't take over `Request`/`FormData`/`URL`.
 *
 * The same list has to be used on both ends of a server function, which is why
 * this comes from a virtual module bundled into the client and the server
 * rather than a runtime option.
 */
const PLUGINS = [...DEFAULT_PLUGINS, ...userPlugins];
const MAX_SERIALIZATION_DEPTH_LIMIT = 64;
const DISABLED_FEATURES = Feature.RegExp;

/**
 * An error thrown by a server function is serialized and rethrown on the
 * client, and seroval includes `Error.prototype.stack` by default. In
 * production that leaks server file paths, internal function names and the
 * shape of the deployment to anyone who can trigger a throw, so strip it.
 * Development keeps the stack: that's where it's actually useful, and the
 * paths it exposes are the developer's own.
 *
 * Only applied when writing; parsing leaves `DISABLED_FEATURES` alone so an
 * incoming payload that does carry a stack still deserializes.
 */
const SERIALIZE_DISABLED_FEATURES = import.meta.env.PROD
  ? DISABLED_FEATURES | Feature.ErrorPrototypeStack
  : DISABLED_FEATURES;

/**
 * `crossSerializeStream` historically ran with every feature enabled, so only
 * add the stack removal here rather than the full serialize set.
 */
const JS_SERIALIZE_DISABLED_FEATURES = import.meta.env.PROD ? Feature.ErrorPrototypeStack : 0;

/**
 * Alexis:
 *
 * A "chunk" is a piece of data emitted by the streaming serializer.
 * Each chunk is represented by a 32-bit value (encoded in hexadecimal),
 * followed by the encoded string (8-bit representation). This format
 * is important so we know how much of the chunk being streamed we
 * are expecting before parsing the entire string data.
 *
 * This is sort of a bootleg "multipart/form-data" except it's bad at
 * handling File/Blob LOL
 *
 * The format is as follows:
 * ;0xFFFFFFFF;<string data>
 */
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const HEADER_SIZE = 12;
const SEMICOLON = 0x3b;
const ZERO = 0x30;
const LOWER_X = 0x78;

/**
 * The largest chunk a server accepts from a client. The header can declare up
 * to 4GB, and the reader buffers that much before it parses anything.
 */
export const MAX_REQUEST_CHUNK_SIZE = 64 * 1024 * 1024;

function createChunkHeader(bytes: number): Uint8Array {
  const hex = bytes.toString(16).padStart(8, "0");
  const head = new Uint8Array(HEADER_SIZE);
  head[0] = SEMICOLON;
  head[1] = ZERO;
  head[2] = LOWER_X;
  for (let i = 0; i < 8; i++) {
    head[3 + i] = hex.charCodeAt(i);
  }
  head[11] = SEMICOLON;
  return head;
}

/**
 * The header and the data are sent as separate pieces, so the encoded data is
 * not copied into a second buffer.
 */
function enqueueChunk(controller: ReadableStreamDefaultController<Uint8Array>, data: string) {
  const encoded = encoder.encode(data);
  controller.enqueue(createChunkHeader(encoded.length));
  controller.enqueue(encoded);
}

export function serializeToJSStream(id: string, value: any) {
  return new ReadableStream({
    start(controller) {
      crossSerializeStream(value, {
        scopeId: id,
        disabledFeatures: JS_SERIALIZE_DISABLED_FEATURES,
        plugins: PLUGINS,
        onSerialize(data: string, initial: boolean) {
          enqueueChunk(controller, initial ? `(${getCrossReferenceHeader(id)},${data})` : data);
        },
        onDone() {
          controller.close();
        },
        onError(error: any) {
          controller.error(error);
        },
      });
    },
  });
}

export function serializeToJSONStream(value: any) {
  return new ReadableStream({
    start(controller) {
      toCrossJSONStream(value, {
        disabledFeatures: SERIALIZE_DISABLED_FEATURES,
        depthLimit: MAX_SERIALIZATION_DEPTH_LIMIT,
        plugins: PLUGINS,
        onParse(node) {
          enqueueChunk(controller, JSON.stringify(node));
        },
        onDone() {
          controller.close();
        },
        onError(error) {
          controller.error(error);
        },
      });
    },
  });
}

function hexValue(code: number): number {
  if (code >= 0x30 && code <= 0x39) return code - 0x30;
  if (code >= 0x61 && code <= 0x66) return code - 0x61 + 10;
  if (code >= 0x41 && code <= 0x46) return code - 0x41 + 10;
  return -1;
}

/** Returns the data size the header declares, or -1 when it is malformed. */
function parseChunkHeader(head: Uint8Array): number {
  if (head[0] !== SEMICOLON || head[1] !== ZERO || head[2] !== LOWER_X || head[11] !== SEMICOLON) {
    return -1;
  }
  let size = 0;
  for (let i = 3; i < 11; i++) {
    const digit = hexValue(head[i]!);
    if (digit === -1) {
      return -1;
    }
    size = size * 16 + digit;
  }
  return size;
}

function malformed(): Error {
  return new Error("Malformed server function stream.");
}

export interface SerovalChunkReaderOptions {
  /** Rejects any chunk larger than this many bytes. */
  maxChunkSize?: number;
}

export class SerovalChunkReader {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  done = false;

  private maxChunkSize: number;
  /** Pieces read from the stream and not yet consumed, in order. */
  private pieces: Uint8Array[] = [];
  private length = 0;

  constructor(stream: ReadableStream<Uint8Array>, options: SerovalChunkReaderOptions = {}) {
    this.reader = stream.getReader();
    this.maxChunkSize = options.maxChunkSize ?? Infinity;
  }

  /** Reads until `size` bytes are buffered or the stream ends. */
  private async fill(size: number): Promise<void> {
    while (this.length < size && !this.done) {
      const chunk = await this.reader.read();
      if (chunk.done) {
        this.done = true;
      } else if (chunk.value.length > 0) {
        this.pieces.push(chunk.value);
        this.length += chunk.value.length;
      }
    }
  }

  /**
   * Removes the first `size` bytes from the buffer. Pieces are only joined
   * when the bytes span more than one, so each byte is copied at most once.
   */
  private take(size: number): Uint8Array {
    const first = this.pieces[0];
    if (first && first.length >= size) {
      if (first.length === size) {
        this.pieces.shift();
      } else {
        this.pieces[0] = first.subarray(size);
      }
      this.length -= size;
      return first.subarray(0, size);
    }
    const result = new Uint8Array(size);
    let offset = 0;
    while (offset < size) {
      const piece = this.pieces[0]!;
      const count = Math.min(piece.length, size - offset);
      result.set(piece.subarray(0, count), offset);
      offset += count;
      if (count === piece.length) {
        this.pieces.shift();
      } else {
        this.pieces[0] = piece.subarray(count);
      }
    }
    this.length -= size;
    return result;
  }

  async next(): Promise<{ done: true; value: undefined } | { done: false; value: string }> {
    await this.fill(HEADER_SIZE);
    if (this.length === 0) {
      return { done: true, value: undefined };
    }
    if (this.length < HEADER_SIZE) {
      throw malformed();
    }
    // The header gives the size of the data, so we know how much to wait for
    // before decoding it.
    const size = parseChunkHeader(this.take(HEADER_SIZE));
    if (size === -1) {
      throw malformed();
    }
    if (size > this.maxChunkSize) {
      throw new Error(
        `Server function stream chunk of ${size} bytes is larger than the limit of ${this.maxChunkSize} bytes.`,
      );
    }
    await this.fill(size);
    if (this.length < size) {
      throw malformed();
    }
    return { done: false, value: decoder.decode(this.take(size)) };
  }

  /** Stops reading and releases the stream, such as after a parse error. */
  async cancel(reason?: unknown): Promise<void> {
    this.pieces = [];
    this.length = 0;
    this.done = true;
    await this.reader.cancel(reason).catch(() => {});
  }

  /** Interprets every remaining chunk. On an error, the stream is cancelled. */
  async drain(interpret: (chunk: string) => void) {
    try {
      while (true) {
        const result = await this.next();
        if (result.done) {
          break;
        }
        interpret(result.value);
      }
    } catch (error) {
      await this.cancel(error);
      throw error;
    }
  }
}

function reportDrainError(error: unknown): void {
  console.error("[solid-start] failed to read the rest of a server function stream:", error);
}

const ignoreRejection = () => {};

/**
 * A decoded payload is the peer's bytes, so a promise it decodes to can reject
 * with nobody holding it: an argument the function never awaits, a field of a
 * result the caller ignores. Seroval stores every promise it decodes in the
 * refs map, including ones that reject synchronously inside `fromCrossJSON`,
 * so claim them as they are stored. Code that awaits the promise still sees
 * the rejection.
 */
class DecodedRefs extends Map<number, unknown> {
  override set(id: number, value: unknown) {
    if (value instanceof Promise) value.catch(ignoreRejection);
    return super.set(id, value);
  }
}

/**
 * Fails every value still waiting on a frame that will not arrive. Seroval
 * keeps these in the refs between frames: open streams and pending-promise
 * resolvers (`{ p, s, f }`). `fromCrossJSON` builds streams from seroval's
 * internal `Stream` class, which only `isStream` recognizes; the eval-based
 * `deserialize` rebuilds them as plain `__SEROVAL_STREAM__` objects. Throwing
 * into a closed stream and rejecting a settled promise are no-ops, so this is
 * safe to run after a body that ended normally.
 *
 * A ref can be any value a plugin decoded, so nothing is read off it unguarded.
 */
function settlePendingRefs(refs: Iterable<unknown>, error: unknown) {
  for (const value of refs) {
    if (value === null || typeof value !== "object") continue;
    try {
      const ref = value as Record<string, any>;
      if (isStream(ref)) {
        ref.throw(error);
      } else if (ref.__SEROVAL_STREAM__ === true && typeof ref.throw === "function") {
        ref.throw(error);
      } else if (
        typeof ref.s === "function" &&
        typeof ref.f === "function" &&
        ref.p instanceof Promise
      ) {
        // seroval stores the resolver before its promise, so a failed second
        // store leaves a promise that `DecodedRefs` never saw
        ref.p.catch(ignoreRejection);
        ref.f(error);
      }
    } catch {
      // a stream listener threw, or a plugin value refused the read
    }
  }
}

function createEndOfStreamError() {
  return new Error("Server function stream ended unexpectedly.");
}

export async function serializeToJSONString(value: any) {
  const response = new Response(serializeToJSONStream(value));
  return await response.text();
}

export async function deserializeFromJSONString(json: string) {
  const blob = new Response(json);
  return await deserializeJSONStream(blob);
}

export async function deserializeJSONStream(
  response: Response | Request,
  options?: SerovalChunkReaderOptions,
) {
  if (!response.body) {
    throw new Error("missing body");
  }
  const reader = new SerovalChunkReader(response.body, options);
  const result = await reader.next().catch(async error => {
    await reader.cancel(error);
    throw error;
  });
  if (!result.done) {
    const refs = new DecodedRefs();

    function interpretChunk(chunk: string): unknown {
      const value = fromCrossJSON(JSON.parse(chunk) as SerovalNode, {
        refs,
        disabledFeatures: DISABLED_FEATURES,
        depthLimit: MAX_SERIALIZATION_DEPTH_LIMIT,
        plugins: PLUGINS,
      });
      return value;
    }

    let value: unknown;
    try {
      value = interpretChunk(result.value);
    } catch (error) {
      await reader.cancel(error);
      throw error;
    }
    // Later chunks settle the promises and streams inside `value`. Once the
    // body is done, whether it ended or failed (a malformed chunk, a dropped
    // connection), nothing can settle what is still waiting on it. A bad chunk
    // is reported here, because nothing else awaits this.
    reader.drain(interpretChunk).then(
      () => settlePendingRefs(refs.values(), createEndOfStreamError()),
      error => {
        reportDrainError(error);
        settlePendingRefs(refs.values(), error);
      },
    );
    return value;
  }
  return undefined;
}

function releaseJSScope(id: string, error: unknown) {
  const scopes = (globalThis as { $R?: Record<string, unknown[] | undefined> }).$R;
  const refs = scopes?.[id];
  if (!refs) return;
  delete scopes[id];
  settlePendingRefs(refs, error);
}

export async function deserializeJSStream(id: string, response: Request | Response) {
  if (!response.body) {
    throw new Error("missing body");
  }
  const reader = new SerovalChunkReader(response.body);

  const result = await reader.next().catch(async error => {
    await reader.cancel(error);
    throw error;
  });

  if (!result.done) {
    let value: unknown;
    try {
      value = deserialize(result.value);
    } catch (error) {
      await reader.cancel(error);
      releaseJSScope(id, error);
      throw error;
    }
    reader.drain(deserialize).then(
      () => releaseJSScope(id, createEndOfStreamError()),
      error => {
        reportDrainError(error);
        releaseJSScope(id, error);
      },
    );
    return value;
  }
  return undefined;
}
