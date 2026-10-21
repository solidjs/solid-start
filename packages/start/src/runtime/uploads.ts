import { createPlugin, type Plugin, type SerovalNode } from "seroval";
import { deserializeFromJSONString } from "./serialization";

/**
 * Files and blobs in the arguments of a server function call go as parts of
 * multipart form data instead of inside the serialized arguments. The
 * arguments go in the `ARGS_PART` field, and each file in `FILE_PART<index>`,
 * where the arguments hold only its index.
 */
export const ARGS_PART = "args";
export const FILE_PART = "file";

/** Marks a call whose serialized arguments come with their files as form parts. */
export const UPLOAD_HEADER = "x-serialized-form";

const UPLOAD_TAG = "solid-start/upload";

/*
 * Migration note: seroval's binary mode (`binary.serialize` and
 * `binary.deserialize`, in development on seroval's `binary-mode` branch)
 * could replace this when server function bodies move to it.
 *
 * Binary mode would be better for the arguments in general:
 * - one body and one format for every value, instead of JSON in a form field;
 * - `ArrayBuffer` and typed array bytes sent as they are, with no base64 and
 *   no `maxBase64Length` limit;
 * - decoding that validates untrusted input and runs no code, as `fromCrossJSON`
 *   does today.
 *
 * For files, the form parts here are still better:
 * - `BlobPlugin` and `FilePlugin` read the whole file with `arrayBuffer()`
 *   before sending it, so a large upload is held in memory on the client. A
 *   `File` in `FormData` is read by the browser as it sends the request.
 * - Sending binary mode output as it is produced needs a streamed request
 *   body (`duplex: "half"`), which not every browser supports. Otherwise the
 *   chunks are collected first, which holds the file in memory again.
 * - Multipart bodies work in every runtime and with every proxy, and servers
 *   read them with `request.formData()`.
 *
 * Neither limits the total size: binary mode leaves that to the transport,
 * and `request.formData()` reads the whole body. A limit belongs in the
 * server either way.
 *
 * When migrating, the arguments can move to binary mode while files keep
 * going as form parts, with binary mode's plugin section writing the part
 * index the way `createUploadSerializer` does. A server should accept both
 * bodies for a while, because an open tab can call a newer server.
 */

type UploadNode = { i: SerovalNode };

/**
 * True for a file or a blob. One from another frame is an instance of that
 * frame's `Blob`, so its shape tells instead.
 */
function isBlob(value: unknown): value is Blob {
  if (value instanceof Blob) return true;
  const blob = value as Partial<Blob> | null;
  return (
    typeof blob === "object" &&
    blob !== null &&
    typeof blob.size === "number" &&
    typeof blob.type === "string" &&
    typeof blob.arrayBuffer === "function" &&
    typeof blob.slice === "function"
  );
}

function malformed(): Error {
  return new Error("Malformed server function upload.");
}

/**
 * Serializes each file or blob in the arguments as its index in `files`, so
 * the call can send it as a form part. Seroval calls this wherever it finds
 * one: in arrays, objects, maps, sets and form data.
 */
export function createUploadSerializer(files: Blob[]): Plugin<Blob, UploadNode> {
  const parse = (value: Blob) => files.push(value) - 1;
  return createPlugin<Blob, UploadNode>({
    tag: UPLOAD_TAG,
    test: isBlob,
    parse: {
      sync: (value, ctx) => ({ i: ctx.parse(parse(value)) }),
      async: async (value, ctx) => ({ i: await ctx.parse(parse(value)) }),
      stream: (value, ctx) => ({ i: ctx.parse(parse(value)) })
    },
    serialize: (node, ctx) => ctx.serialize(node.i),
    deserialize: () => {
      throw malformed();
    }
  });
}

/**
 * Turns each index written by `createUploadSerializer` back into its part of
 * `form`. It is only used for a multipart call, so an index in any other body
 * fails to deserialize.
 */
export function createUploadDeserializer(form: FormData): Plugin<Blob, UploadNode> {
  return createPlugin<Blob, UploadNode>({
    tag: UPLOAD_TAG,
    test: () => false,
    parse: {
      sync: () => {
        throw malformed();
      },
      async: async () => {
        throw malformed();
      },
      stream: () => {
        throw malformed();
      }
    },
    serialize: () => {
      throw malformed();
    },
    deserialize: (node, ctx) => {
      const index = ctx.deserialize(node.i);
      if (typeof index !== "number" || !Number.isSafeInteger(index) || index < 0) {
        throw malformed();
      }
      const part = form.get(`${FILE_PART}${index}`);
      if (!(part instanceof Blob)) throw malformed();
      return part;
    }
  });
}

/**
 * A blob of another frame is copied, because form data only takes blobs of
 * its own.
 */
export async function appendUploads(form: FormData, files: Blob[]): Promise<void> {
  const blobs = await Promise.all(
    files.map(async file =>
      file instanceof Blob
        ? file
        : new Blob([await (file as Blob).arrayBuffer()], { type: (file as Blob).type })
    )
  );
  for (const [index, blob] of blobs.entries()) {
    form.set(`${FILE_PART}${index}`, blob, (files[index] as Partial<File>).name ?? "blob");
  }
}

/** Reads the arguments of a call with files: the serialized arguments, with each index replaced by its part. */
export async function readUploadArgs(form: FormData): Promise<unknown> {
  const args = form.get(ARGS_PART);
  if (typeof args !== "string") throw malformed();
  return await deserializeFromJSONString(args, [createUploadDeserializer(form)]);
}
