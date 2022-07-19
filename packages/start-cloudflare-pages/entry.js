import manifest from "../../dist/route-manifest.json";
import handler from "./handler";

export const onRequestGet = ({ request, next }) => {
  // Handle static assets
  if (/\.\w+$/.test(request.url)) {
    return next(request);
  }

  return handler({
    request: request,
    env: { manifest }
  });
};

export const onRequestHead = ({ request, next }) => {
  // Handle static assets
  if (/\.\w+$/.test(request.url)) {
    return next(request);
  }

  return handler({
    request: request,
    env: { manifest }
  });
};

export async function onRequestPost({ request }) {
  // Allow for POST /_m/33fbce88a9 server function
  return handler({
    request: request,
    env: { manifest }
  });
}

export async function onRequestDelete({ request }) {
  // Allow for POST /_m/33fbce88a9 server function
  return handler({
    request: request,
    env: { manifest }
  });
}

export async function onRequestPatch({ request }) {
  // Allow for POST /_m/33fbce88a9 server function
  return handler({
    request: request,
    env: { manifest }
  });
}
