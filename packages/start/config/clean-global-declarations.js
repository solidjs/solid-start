/**
 * @info some module-scope declarations `console.log` may escape code-removal and
 * may cause variable leak if not properly cleaned up.
 *
 * @description Post-process cleanup plugin to remove server-only code leaks from client bundles.
 * This runs AFTER all other transformations (TanStack, Vinxi, etc.) to clean up
 * any remaining module-level calls and expressions that could leak server secrets.
 *
 * @target module-level calls like console.log()
 */
export function cleanGlobalDeclarations() {
  return {
    name: "global-server-declaration-cleanup",
    /**
     * @info `enforce: post` will run after all plugins to ensure no interference
     * with existing code-removal tools and server-fn logic.
     */
    enforce: "post",
    generateBundle(options, bundle) {
      console.log(
        `[global-server-declaration-cleanup] Processing bundle with format: ${options.format}`
      );

      // Only process client bundles (es modules or iife for browsers)
      if (options.format !== "es" && options.format !== "iife") {
        console.log(
          `[global-server-declaration-cleanup] Skipping non-client bundle format: ${options.format}`
        );
        return;
      }

      // Process each chunk in the bundle
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === "chunk" && chunk.code) {
          console.log(`[global-server-declaration-cleanup] Processing chunk: ${fileName}`);

          // Check if this chunk contains server secrets before cleaning
          const hasSecrets = chunk.code.includes("SERVER ONLY SECRET");
          if (hasSecrets) {
            console.log(
              `[global-server-declaration-cleanup] Found secrets in ${fileName}, attempting cleanup`
            );
          }

          try {
            const cleanedCode = cleanupServerLeaks(chunk.code);
            if (cleanedCode !== chunk.code) {
              chunk.code = cleanedCode;
              console.log(
                `[global-server-declaration-cleanup] Successfully cleaned server leaks from ${fileName}`
              );
            } else if (hasSecrets) {
              console.warn(
                `[global-server-declaration-cleanup] Secrets detected but no cleanup performed in ${fileName}`
              );
            }
          } catch (error) {
            console.warn(
              `[global-server-declaration-cleanup] Failed to process ${fileName}:`,
              error.message
            );
          }
        }
      }
    }
  };
}

/**
 * @info In-depth cleaning
 * since this plugin runs last, it may receive formatted or minified code.
 */
function cleanupServerLeaks(code) {
  let cleanedCode = code;

  /**
   * @info  Remove variable declarations potentially
   * @target let , const, var
   */
  cleanedCode = cleanedCode.replace(
    /(?:const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*[\s\S]*?(?:;|\n|$)/g,
    ""
  );

  // Pattern 4: Remove other standalone console methods that might leak
  // fixed a stray '}' in the alternation
  /**
   * @info Remove standalone console methods that might leak
   * @target console: log, warn, error, info, debug, table
   */
  cleanedCode = cleanedCode.replace(
    /^[\s]*console\.(warn|error|info|debug|log|table)\([^)]*\);?[\s]*$/gm,
    ""
  );

  /**
   * @info Remove empty statements and consolidate multiple semicolons
   */
  cleanedCode = cleanedCode.replace(/;\s*;+/g, ";");

  /**
   * @info Remove multiple empty lines left by removals
   */
  cleanedCode = cleanedCode.replace(/\n\s*\n\s*\n/g, "\n\n");

  return cleanedCode;
}
