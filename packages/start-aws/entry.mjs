import { splitCookiesString } from "solid-start/node/fetch.js";
import "solid-start/node/globals.js";
import manifest from "../../dist/client/route-manifest.json";
import server from "./entry-server";

export async function handler(event) {
  const { requestContext } = event
  const response = await server({
    request: createRequest(event),
    clientAddress:
      requestContext.identity?.sourceIp
      ?? requestContext.http?.sourceIp,
    locals: {},
    env: { manifest },
  });

  const headers = {};
  for (const [name, value] of response.headers) {
    headers[name] = value;
  }
  if (response.headers.has('set-cookie')) {
		const header = /** @type {string} */ (response.headers.get('set-cookie'));
		// @ts-expect-error
		headers['set-cookie'] =  splitCookiesString(header);
	}

  return {
    statusCode: response.status,
    headers: headers,
    body: await response.text(),
  };
}

function createRequest(event) {
  const url = new URL(
    event.path,
    `https://${event.requestContext.domainName}`
  );

  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers)) {
    headers.append(key, value);
  }

  const init = {
    method: event.requestContext.httpMethod,
    headers,
  };

  if (event.httpMethod !== "GET" && event.httpMethod !== "HEAD" && event.body) {
    init.body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString()
      : event.body;
  }

  return new Request(url.href, init);
}
