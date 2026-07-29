/**
 * Re-exports Seroval's plugin authoring API for use with the
 * `serialization.plugins` option in `vite.config.ts`.
 *
 * Importing from here rather than depending on `seroval` directly keeps plugin
 * authors on the exact Seroval version SolidStart serializes with. A mismatched
 * version would not fail the build: it would produce plugin nodes the other end
 * of the wire can't interpret.
 *
 * @see https://github.com/solidjs/solid-start/issues/1474
 *
 * @example
 * ```ts
 * // src/seroval-plugins.ts
 * import { createPlugin } from "@solidjs/start/serialization";
 * import { ObjectId } from "mongodb";
 *
 * const ObjectIdPlugin = createPlugin<ObjectId, { hex: any }>({
 *   tag: "app/ObjectId",
 *   test: value => value instanceof ObjectId,
 *   parse: {
 *     sync: (value, ctx) => ({ hex: ctx.parse(value.toHexString()) }),
 *     async: async (value, ctx) => ({ hex: await ctx.parse(value.toHexString()) }),
 *     stream: (value, ctx) => ({ hex: ctx.parse(value.toHexString()) }),
 *   },
 *   serialize: (node, ctx) => `globalThis.ObjectId(${ctx.serialize(node.hex)})`,
 *   deserialize: (node, ctx) => new ObjectId(ctx.deserialize(node.hex) as string),
 * });
 *
 * export default [ObjectIdPlugin];
 * ```
 */
export { createPlugin, OpaqueReference } from "seroval";
export type {
  AsyncParsePluginContext,
  DeserializePluginContext,
  Plugin,
  PluginData,
  PluginInfo,
  SerializePluginContext,
  SerovalNode,
  StreamParsePluginContext,
  SyncParsePluginContext,
} from "seroval";
