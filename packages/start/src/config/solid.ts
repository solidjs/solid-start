import type { Plugin, PluginOption } from "vite";
import solid, { type Options as SolidOptions } from "vite-plugin-solid";

type CompilerOptions = NonNullable<SolidOptions["solid"]> & {
  /**
   * Leave the templates of `$ServerOnly` elements out of client bundles.
   * Added in `babel-plugin-jsx-dom-expressions` 0.40.10, and on by default.
   */
  omitServerOnlyTemplates?: boolean;
};

/**
 * `vite-plugin-solid`, set up so that hot reloading works with `$ServerOnly`.
 *
 * The Solid compiler leaves the templates of `$ServerOnly` elements out of the
 * client bundle, since hydration reuses the server-rendered DOM. Hot module
 * replacement re-runs the component on the client and needs them, so without
 * them the first edit throws "template is not a function"
 * (https://github.com/solidjs/solid-start/issues/1930). In dev, keep them.
 * Production builds still leave them out, and a value set by the user is kept.
 */
export function solidPlugins(options: Partial<SolidOptions>): PluginOption[] {
  const compilerOptions: CompilerOptions = { ...options.solid };

  const serverOnlyHmr: Plugin = {
    name: "solid-start:server-only-hmr",
    configResolved(config) {
      // vite-plugin-solid reads these options on every transform, and uses the
      // same condition to decide whether to enable hot reloading.
      if (
        config.command === "serve" &&
        config.mode !== "production" &&
        options.hot !== false &&
        !("omitServerOnlyTemplates" in compilerOptions)
      ) {
        compilerOptions.omitServerOnlyTemplates = false;
      }
    },
  };

  return [serverOnlyHmr, solid({ ...options, solid: compilerOptions })];
}
