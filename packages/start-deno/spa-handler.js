export default async function entry({ request, env }) {
  const text = await Deno.readFile(`./public/index.html`);

  return new Response(text, {
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}
