import "../node/globals.js";

/**
 * gets the HTML string from a given URL
 * @param {string | URL} url 
 * @returns {Promise<string>} HTML
 */
export async function createHTML(url) {
  return await (await fetch(new Request(url))).text();
}
