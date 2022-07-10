import manifest from "../../dist/bucket/rmanifest.json";
import assetManifest from "../../dist/bucket/manifest.json";
import prepareManifest from "solid-start/runtime/prepareManifest";
prepareManifest(manifest, assetManifest);

import "solid-start/runtime/node-globals";
import { Headers, Request, Response } from "undici";
import entry from "./app";

prepareManifest(manifest, assetManifest);

export async function handler(event) {
  const record = event.Records[0].cf;

  const requestHeaders = new Headers();
  for (const [key, value] of Object.entries(record.request.headers)) {
    requestHeaders.append(key, value[0]);
  }
  const request = new Request(
    new URL(
      record.request.uri,
      `https://${record.config.distributionDomainName}`
    ),
    {
      method: record.request.method,
      headers: requestHeaders,
    }
  );
  const response = await entry({
    request,
    responseHeaders: new Headers(),
    manifest,
  });

  const responseHeaders = {};
  for (const [name, value] of response.headers) {
    responseHeaders[name] = [
      {
        key: name,
        value: value,
      },
    ];
  }

  return {
    status: response.status,
    statusDescription: "OK",
    headers: responseHeaders,
    body: await response.text(),
  };
}
