import {
  crossSerializeStream,
  deserialize,
  Feature,
  fromCrossJSON,
  fromJSON,
  getCrossReferenceHeader,
  type SerovalNode,
  toCrossJSONStream,
  toJSONAsync,
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

// TODO(Alexis): if we can, allow providing an option to extend these.
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
const MAX_SERIALIZATION_DEPTH_LIMIT = 64;
const DISABLED_FEATURES = Feature.RegExp;

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
function createChunk(data: string): Uint8Array {
  const encodeData = new TextEncoder().encode(data);
  const bytes = encodeData.length;
  const baseHex = bytes.toString(16);
  const totalHex = "00000000".substring(0, 8 - baseHex.length) + baseHex; // 32-bit
  const head = new TextEncoder().encode(`;0x${totalHex};`);

  const chunk = new Uint8Array(12 + bytes);
  chunk.set(head);
  chunk.set(encodeData, 12);
  return chunk;
}

export function serializeToJSStream(id: string, value: any) {
  return new ReadableStream({
    start(controller) {
      crossSerializeStream(value, {
        scopeId: id,
        plugins: DEFAULT_PLUGINS,
        onSerialize(data: string, initial: boolean) {
          controller.enqueue(
            createChunk(
              initial ? `(${getCrossReferenceHeader(id)},${data})` : data,
            ),
          );
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
        disabledFeatures: DISABLED_FEATURES,
        depthLimit: MAX_SERIALIZATION_DEPTH_LIMIT,
        plugins: DEFAULT_PLUGINS,
        onParse(node) {
          controller.enqueue(createChunk(JSON.stringify(node)));
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
      const newBuffer = new Uint8Array(this.buffer.length + chunk.value.length);
      newBuffer.set(this.buffer);
      newBuffer.set(chunk.value, this.buffer.length);
      this.buffer = newBuffer;
    } else {
      this.done = true;
    }
  }

  async next(): Promise<
    { done: true; value: undefined } | { done: false; value: string }
  > {
    // Check if the buffer is empty
    if (this.buffer.length === 0) {
      // if we are already done...
      if (this.done) {
        return {
          done: true,
          value: undefined,
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
    if (Number.isNaN(bytes)) {
      throw new Error("Malformed server function stream header.");
    }

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
    const partial = new TextDecoder().decode(
      this.buffer.subarray(12, 12 + bytes),
    );
    // The rest goes to the buffer
    this.buffer = this.buffer.subarray(12 + bytes);

    // Deserialize the chunk
    return {
      done: false,
      value: partial,
    };
  }

  async drain(interpret: (chunk: string) => void) {
    while (true) {
      const result = await this.next();
      if (result.done) {
        break;
      } else {
        interpret(result.value);
      }
    }
  }
}

export async function serializeToJSONString(value: any) {
  // const response = new Response(serializeToJSONStream(value));
  // return await response.text();
  return JSON.stringify(toJSONAsync(value, {
    plugins: DEFAULT_PLUGINS,
    depthLimit: MAX_SERIALIZATION_DEPTH_LIMIT,
    disabledFeatures: DISABLED_FEATURES,
  }));
}

export async function deserializeFromJSONString(json: string) {
  return fromJSON(JSON.parse(json), {
    plugins: DEFAULT_PLUGINS,
    disabledFeatures: DISABLED_FEATURES,
  });
}

export async function deserializeJSONStream(response: Response | Request) {
  if (!response.body) {
    throw new Error("missing body");
  }
  const reader = new SerovalChunkReader(response.body);
  const result = await reader.next();
  if (!result.done) {
    const refs = new Map();

    function interpretChunk(chunk: string): unknown {
      const value = fromCrossJSON(JSON.parse(chunk) as SerovalNode, {
        refs,
        disabledFeatures: DISABLED_FEATURES,
        depthLimit: MAX_SERIALIZATION_DEPTH_LIMIT,
        plugins: DEFAULT_PLUGINS,
      });
      return value;
    }

    void reader.drain(interpretChunk);

    return interpretChunk(result.value);
  }
  return undefined;
}

export async function deserializeJSStream(id: string, response: Response) {
  if (!response.body) {
    throw new Error("missing body");
  }
  const reader = new SerovalChunkReader(response.body);

  const result = await reader.next();

  if (!result.done) {
    reader.drain(deserialize).then(
      () => {
        // @ts-ignore
        delete $R[id];
      },
      () => {
        // no-op
      },
    );
    return deserialize(result.value);
  }
  return undefined;
}
