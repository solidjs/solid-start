/**
 * Helper function to get a human readable name for the given HTTP Verb
 * @param {string} verb
 * @returns {string} The uppercase and readable verb name
 */
function getHTTPVerbName(verb) {
  return verb.toUpperCase();
}

/**
 * Helper function to format routes for profit
 * @param {any} routes flattened routes
 * @param {string} routeCat route category name
 * @param {function(Object): string} colorFn mapped formatter function

 * @returns {void}
 */
function prettyRoutes(routes, routeCat, colorFn) {
  let base = routes.map(colorFn);
  if (base.length > 0) {
    base[0] = "┌─" + base[0].slice(2);
    base[base.length - 1] = "└─" + base[base.length - 1].slice(2);
    base = base.map(b => `     ${b}`).join("\n");
  } else {
    base = "     None! 👻";
  }
  console.log(`  ${c.green("➜")}  ${c.bold(routeCat + ":")}\n${base}`);
}

import c from "picocolors";

export default function printUrls(router, url) {
  console.log("");
  prettyRoutes(
    router.getFlattenedPageRoutes(),
    "Page Routes",
    r => `├─ ${c.blue(`${url}${r.path}`)}`
  );

  console.log("");
  prettyRoutes(
    router.getFlattenedApiRoutes(),
    "API Routes",
    r =>
      `├─  ${c.green(`${url}${r.path}`)} ${c.dim(
        Object.keys(r.apiPath).map(getHTTPVerbName).join(" | ")
      )}`
  );
  console.log("");
}
