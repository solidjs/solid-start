import path from "node:path";
import * as babel from "@babel/core";
import { directivesPlugin, type StateContext } from "./plugin.ts";
import xxHash32 from "./xxhash32.ts";

export interface CompileResult {
  valid: boolean;
  code: string;
  map: babel.BabelFileResult["map"];
}

export type CompileOptions = Omit<StateContext, "count" | "hash" | "imports">;

export async function compile(
  id: string,
  code: string,
  options: CompileOptions,
): Promise<CompileResult> {
  const context: StateContext = {
      ...options,
      hash: xxHash32(id).toString(16),
      count: 0,
      imports: new Map(),
    } 
  const pluginOption = [
    directivesPlugin,
    context,
  ];
  const plugins: NonNullable<NonNullable<babel.TransformOptions["parserOpts"]>["plugins"]> = [
    "jsx",
  ];
  if (/\.[mc]?tsx?$/i.test(id)) {
    plugins.push("typescript");
  }
  const result = await babel.transformAsync(code, {
    plugins: [pluginOption],
    parserOpts: {
      plugins,
    },
    filename: path.basename(id),
    ast: false,
    sourceMaps: true,
    configFile: false,
    babelrc: false,
    sourceFileName: id,
  });

  if (result) {
    return {
      valid: context.count > 0,
      code: result.code || "",
      map: result.map,
    };
  }
  throw new Error("invariant");
}
