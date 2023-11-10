import "solid-start/node/globals.js";
import manifest from "../../dist/client/route-manifest.json";
import server from "./entry-server";

export async function handler(event) {
  function internalFetch(route, init = {}) {
    if (route.startsWith("http")) {
      return fetch(route, init);
    }

    let url = new URL(route, "http://internal");
    const request = new Request(url.href, init);
    return server({
      request,
      clientAddress: event.Records[0].cf.request.clientIp,
      locals: {},
      env: { manifest },
      fetch: internalFetch
    });
  }

  const response = await server({
    request: createRequest(event),
    clientAddress: event.Records[0].cf.request.clientIp,
    locals: {},
    env: { manifest },
    fetch: internalFetch
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

function createRequest(event) {
  const record = event.Records[0].cf;

  // Build URL
  const url = new URL(
    record.request.uri,
    `https://${record.config.distributionDomainName}`
  );

  // Build headers
  const headers = new Headers();
  for (const [key, value] of Object.entries(record.request.headers)) {
    headers.append(key, value[0]);
  }

  return new Request(url, {
    method: record.request.method,
    headers,
  });
}
