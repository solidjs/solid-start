import { readFile } from "fs/promises";
let indexHTML = INDEX_HTML;
export default async function entry({ request, responseHeaders, manifest }) {
  console.log(indexHTML);
  let text = await readFile(indexHTML, "utf8");

  return new Response(text, {
    headers: {
      "Content-Type": "text/html"
    }
  });
}
