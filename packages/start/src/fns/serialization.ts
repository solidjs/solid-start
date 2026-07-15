// Serialization for the server function transport.
//
// Layering (a rough taxonomy used across fns/*):
// - [protocol] the wire contract both peers must agree on. The JSON codec
//   (plugins, feature policy, depth limit) lives in @solidjs/web/serialization
//   and is consumed here — Start no longer owns those defaults.
// - [generic]  transport machinery any implementation would need (the chunk
//   framing below). Candidate for hoisting alongside the codec later.
// - [policy]   Start-specific choices, e.g. the opt-in "js" (eval) mode.
import {
  createJSONDeserializer,
  resolveSerializerPlugins,
  serializeJSON,
  type SerovalNode,
} from "@solidjs/web/serialization";
import { crossSerializeStream, deserialize, getCrossReferenceHeader } from "seroval";

/**
 * [generic] Chunk framing.
 *
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

/**
 * [policy] "js" mode: chunks are executable JS the client `eval()`s. More
 * compact than the JSON codec but incompatible with a strict CSP, so it is
 * opt-in (`serialization.mode: "js"`). Uses raw seroval because the wire
 * format (cross-reference header + deserialize) differs from both hydration
 * output and the JSON codec; only the plugin set is shared.
 */
export function serializeToJSStream(id: string, value: any) {
  return new ReadableStream({
    start(controller) {
      crossSerializeStream(value, {
        scopeId: id,
        plugins: resolveSerializerPlugins(),
        onSerialize(data: string, initial: boolean) {
          controller.enqueue(
            createChunk(initial ? `(${getCrossReferenceHeader(id)},${data})` : data),
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

/**
 * [protocol] JSON mode (the default): chunks are SerovalNode JSON decoded
 * without eval. Codec defaults (web plugins, RegExp disabled, depth limit)
 * come from @solidjs/web/serialization so both peers stay in agreement.
 */
export function serializeToJSONStream(value: any) {
  return new ReadableStream({
    start(controller) {
      serializeJSON(value, {
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

  async next(): Promise<{ done: true; value: undefined } | { done: false; value: string }> {
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
      throw new Error("Malformed server function stream.");
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
    const partial = new TextDecoder().decode(this.buffer.subarray(12, 12 + bytes));
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
  const response = new Response(serializeToJSONStream(value));
  return await response.text();
}

export async function deserializeFromJSONString(json: string) {
  const blob = new Response(json);
  return await deserializeJSONStream(blob);
}

export async function deserializeJSONStream(response: Response | Request) {
  if (!response.body) {
    throw new Error("missing body");
  }
  const reader = new SerovalChunkReader(response.body);
  const result = await reader.next();
  if (!result.done) {
    // Cross-references between chunks resolve through state inside the
    // deserializer, so one instance handles the whole stream.
    const deserializeChunk = createJSONDeserializer();

    function interpretChunk(chunk: string): unknown {
      return deserializeChunk(JSON.parse(chunk) as SerovalNode);
    }

    void reader.drain(interpretChunk);

    return interpretChunk(result.value);
  }
  return undefined;
}

export async function deserializeJSStream(id: string, response: Request | Response) {
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
