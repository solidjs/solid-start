export default async function entry({ request, env }) {
  return await env.getAssetFromKV(new Request(new URL("/index.html", request.url)));
}
