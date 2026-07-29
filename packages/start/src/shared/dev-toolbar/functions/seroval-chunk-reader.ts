// Reads the byte-header-framed chunk stream the server-function inspector
// captures, yielding one serialized Seroval chunk at a time.
export class SerovalChunkReader {
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
