import { readFile } from "fs/promises";
export default async function entry({ request, responseHeaders, manifest }) {
  let text = await readFile(INDEX_HTML, "utf8");

  return new Response(text, {
    headers: {
      "Content-Type": "text/html"
    }
  });
}
