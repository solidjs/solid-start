import manifest from "../../dist/bucket/rmanifest.json";
import assetManifest from "../../dist/bucket/manifest.json";
import prepareManifest from "solid-start/runtime/prepareManifest";
prepareManifest(manifest, assetManifest);

import "solid-start/runtime/node-globals";
import { Headers, Request, Response } from "undici";
import entry from "./app";

// prepareManifest(manifest, assetManifest);

export async function handler(event) {
  const response = await entry({
    request: createRequest(event),
    responseHeaders: new Headers(),
    manifest,
  });

  const headers = {};
  for (const [name, value] of response.headers) {
    headers[name] = value;
  }

  return {
    statusCode: response.status,
    headers: headers,
    body: await response.text(),
  };
}

function createRequest(event) {
  const url = new URL(
    event.rawPath,
    `https://${event.requestContext.domainName}`
  );

  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers)) {
    headers.append(key, value);
  }

  const init = {
    method: event.requestContext.http.method,
    headers,
  };

  if (event.httpMethod !== "GET" && event.httpMethod !== "HEAD" && event.body) {
    init.body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString()
      : event.body;
  }

  return new Request(url.href, init);
}
