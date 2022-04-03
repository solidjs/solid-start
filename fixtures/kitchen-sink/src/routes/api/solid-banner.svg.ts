import { RequestContext } from "solid-start/entry-server";
import { ContentTypeHeader, json } from "solid-start/server";

export async function get({ request }: RequestContext) {
  const url = new URL(request.url);
  const response = await fetch(
    `https://assets.solidjs.com/banner?project=${url.searchParams.get("project")}&type=core`
  );
  return new Response(response.body, {
    headers: {
      [ContentTypeHeader]: "image/svg+xml"
    }
  });
}
