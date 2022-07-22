import "../node/globals.js";

export async function createHTML(url) {
  return await (await fetch(new Request(url))).text();
}
