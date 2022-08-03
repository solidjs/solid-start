export default async function entry({ request, env }) {
  // console.log(request.url.toString(), new URL("./index.html", request.url).toString());
  // console.log(env.ASSETS, env);
  // const response = await env.ASSETS.fetch(new URL("./index.html", request.url));
  // console.log(response.status, response.headers);

  // return new Response();
  return env.next();
}
