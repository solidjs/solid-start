import manifest from "../../dist/public/route-manifest.json";
import handler from "./handler";

export const onRequestGet = ({ request, next, env }) => {
  // Handle static assets
  if (/\.\w+$/.test(request.url)) {
    return next(request);
  }

  env.manifest = manifest;
  env.next = next;
  return handler({
    request: request,
    env
  });
};

export const onRequestHead = ({ request, next, env }) => {
  // Handle static assets
  if (/\.\w+$/.test(request.url)) {
    return next(request);
  }

  env.manifest = manifest;
  env.next = next;
  return handler({
    request: request,
    env
  });
};

export async function onRequestPost({ request, env }) {
  // Allow for POST /_m/33fbce88a9 server function
  env.manifest = manifest;
  return handler({
    request: request,
    env
  });
}

export async function onRequestDelete({ request, env }) {
  // Allow for POST /_m/33fbce88a9 server function
  env.manifest = manifest;
  return handler({
    request: request,
    env
  });
}

export async function onRequestPatch({ request, env }) {
  // Allow for POST /_m/33fbce88a9 server function
  env.manifest = manifest;
  return handler({
    request: request,
    env
  });
}
