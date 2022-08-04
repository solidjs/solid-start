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
  let routes = router
    .getFlattenedPageRoutes()
    .map(r => `├─ ${c.blue(`${url}${r.path}`)}`)
  routes[0] = '┌─' + routes[0].slice(2)
  routes[routes.length - 1] = '└─' + routes[routes.length - 1].slice(2)
  
  console.log(
    `${c.bold('Page Routes:')}\n${routes.join('\n')}`
  );
  
  let apiRoutes = router
    .getFlattenedApiRoutes()
    .map(
      r =>
        `├─  ${c.green(`${url}${r.path}`)} ${c.dim(
          Object.keys(r.apiPath).map(getHTTPVerbName).join(" | ")
        )}`
    )
  if (apiRoutes.length > 0) {
    apiRoutes[0] = '┌─' + apiRoutes[0].slice(2)
    apiRoutes[apiRoutes.length - 1] = '└─' + apiRoutes[apiRoutes.length - 1].slice(2)
  }

  console.log(
    `${c.bold('API Routes:')}\n${apiRoutes > 0 ? apiRoutes.join('\n') : '   None! 👻'}`
  );
}
