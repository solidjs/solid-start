import manifest from "../../dist/public/route-manifest.json";
import handler from "./entry-server";

export const onRequestGet = async ({ request, next, env }) => {
  // Handle static assets
  if (/\.\w+$/.test(request.url)) {
    let resp = await next(request);
    if (resp.status === 200 || 304) {
      return resp;
    }
  }

  const clientAddress = request.headers.get('cf-connecting-ip')

  env.manifest = manifest;
  env.next = next;
  env.getStaticHTML = async path => {
    return next();
  };

  function internalFetch(route, init = {}) {
    let url = new URL(route, "http://internal");
    const request = new Request(url.href, init);
    return handler({
      request,
      clientAddress,
      locals: {},
      env,
      fetch: internalFetch
    });
  }
  return handler({
    request,
    clientAddress,
    locals: {},
    env,
    fetch: internalFetch
  });
};

export const onRequestHead = async ({ request, next, env }) => {
  // Handle static assets
  if (/\.\w+$/.test(request.url)) {
    let resp = await next(request);
    if (resp.status === 200 || 304) {
      return resp;
    }
  }

  env.manifest = manifest;
  env.next = next;
  env.getStaticHTML = async path => {
    return next();
  };
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
