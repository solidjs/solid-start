import { createPlugin } from "@solidjs/start/serialization";
import { ObjectId } from "./utils/object-id.ts";

/**
 * Bundled into both the client and the server via `serialization.plugins`, so
 * this module must not import server-only code.
 *
 * `deserialize` is what rebuilds the value under the default `"json"`
 * serialization mode. `serialize` is only used by `mode: "js"`, where the
 * payload is evaluated on the client and can therefore reference globals only,
 * which is why it reaches for `globalThis` rather than the imported class.
 */
const ObjectIdPlugin = createPlugin<ObjectId, { hex: any }>({
  tag: "tests/ObjectId",
  test: value => value instanceof ObjectId,
  parse: {
    sync: (value, ctx) => ({ hex: ctx.parse(value.hex) }),
    async: async (value, ctx) => ({ hex: await ctx.parse(value.hex) }),
    stream: (value, ctx) => ({ hex: ctx.parse(value.hex) }),
  },
  serialize: (node, ctx) => `globalThis.ObjectId(${ctx.serialize(node.hex)})`,
  deserialize: (node, ctx) => new ObjectId(ctx.deserialize(node.hex) as string),
});

(globalThis as any).ObjectId = (hex: string) => new ObjectId(hex);

export default [ObjectIdPlugin];
