import { Request, Headers } from "undici";

function createHeaders(requestHeaders) {
  let headers = new Headers();

  for (let [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  return headers;
}

export function createRequest(req) {
  let origin = `${req.protocol}://${req.headers.host}`;
  let url = new URL(req.url, origin);

  let init = {
    method: req.method,
    headers: createHeaders(req.headers)
  };

  return new Request(url.href, init);
}