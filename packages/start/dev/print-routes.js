/**
 * Helper function to get a human readable name for the given HTTP Verb
 * @param {string} verb
 * @returns {string} The uppercase and readable verb name
 */
function getHTTPVerbName(verb) {
  if (verb === "del") {
    return "DELETE";
  }
  return verb.toUpperCase();
}

import c from "picocolors";

export default function printUrls(router, url) {
  console.log(
    `${`  > Page Routes: `}\n${router
      .getFlattenedPageRoutes()
      .map(r => `     ${c.blue(`${url}${r.path}`)}`)
      .join("\n")}`
  );
  console.log("");
  console.log(
    `${`  > API Routes: `}\n${router
      .getFlattenedApiRoutes()
      .map(
        r =>
          `     ${c.green(`${url}${r.path}`)} ${c.dim(
            Object.keys(r.apiPath).map(getHTTPVerbName).join(" | ")
          )}`
      )
      .join("\n")}`
  );
}
