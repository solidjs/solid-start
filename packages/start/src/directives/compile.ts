import * as babel from "@babel/core";
import { directivesPlugin, type StateContext } from "./plugin.ts";
import xxHash32 from "./xxhash32.ts";

export interface CompileResult {
  valid: boolean;
  code: string;
  map: babel.BabelFileResult["map"];
  /** Problems that do not stop the compile, reported to the caller. */
  warnings: string[];
}

export type CompileOptions = Omit<
  StateContext,
  "count" | "hash" | "imports" | "valid" | "warnings"
>;

export async function compile(
  id: string,
  code: string,
  options: CompileOptions,
): Promise<CompileResult> {
  const context: StateContext = {
    ...options,
    valid: false,
    warnings: [],
    hash: xxHash32(id).toString(16),
    count: 0,
    imports: new Map(),
  };
  const pluginOption = [directivesPlugin, context];
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
    // The full path, so diagnostics point at the file the user edits.
    filename: id,
    ast: false,
    sourceMaps: true,
    configFile: false,
    babelrc: false,
    sourceFileName: id,
  });

  if (result) {
    return {
      valid: context.valid,
      code: result.code || "",
      map: result.map,
      warnings: context.warnings,
    };
  }
  throw new Error("invariant");
}
