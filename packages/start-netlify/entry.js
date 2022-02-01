import manifest from "../../dist/rmanifest.json";
import assetManifest from "../../dist/manifest.json";
import prepareManifest from "solid-start/runtime/prepareManifest";
import { fetch, Headers, Response, Request } from "undici";
import entry from "./app";

Object.assign(globalThis, {
  Request,
  Response,
  fetch
});

prepareManifest(manifest, assetManifest);

exports.handler = async function (event, context) {
  console.log(`Received new request: ${event.path}`);

  const webRes = await entry({ request: createRequest(event), headers: new Headers(), manifest });
  const headers = {};
  for (const [name, value] of webRes.headers) {
    headers[name] = [value];
  }

  return {
    statusCode: webRes.status,
    statusMessage: webRes.statusText,
    multiValueHeaders: headers,
    body: await webRes.text()
  };
};

// Borrowed and inspired by: https://github.com/remix-run/remix/blob/main/packages/remix-netlify/server.ts
function createRequest(event) {
  let url;

  if (process.env.NODE_ENV !== "development") {
    url = new URL(event.rawUrl);
  } else {
    let origin = event.headers.host;
    let rawPath = getRawPath(event);
    url = new URL(rawPath, `http://${origin}`);
  }

  let init = {
    method: event.httpMethod,
    headers: createHeaders(event.multiValueHeaders)
  };

  if (event.httpMethod !== "GET" && event.httpMethod !== "HEAD" && event.body) {
    init.body = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString() : event.body;
  }

  return new Request(url.href, init);
}

function createHeaders(requestHeaders) {
  let headers = new Headers();

  for (const [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      for (const value of values) {
        headers.append(key, value);
      }
    }
  }

  return headers;
}

// `netlify dev` doesn't return the full url in the event.rawUrl, so we need to create it ourselves
function getRawPath(event) {
  let rawPath = event.path;
  let searchParams = new URLSearchParams();

  if (!event.multiValueQueryStringParameters) {
    return rawPath;
  }

  let paramKeys = Object.keys(event.multiValueQueryStringParameters);
  for (let key of paramKeys) {
    let values = event.multiValueQueryStringParameters[key];
    if (!values) continue;
    for (let val of values) {
      searchParams.append(key, val);
    }
  }

  let rawParams = searchParams.toString();

  if (rawParams) rawPath += `?${rawParams}`;

  return rawPath;
}
