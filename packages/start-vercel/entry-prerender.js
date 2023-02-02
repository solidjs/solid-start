import { splitCookiesString } from "solid-start/node/fetch.js";
import "solid-start/node/globals.js";
import manifest from "../../.vercel/output/static/route-manifest.json";
import entry from "./entry-server";


export default async (req, res) => {
  console.log(`Received new request: ${req.url}`);

  let request = createRequest(req)
  const webRes = await entry({
    request,
    env: {
      manifest,
      getStaticHTML: async (path) =>
        new Response((await fetch(new URL(`${path}.html`, request.url).href)).body, {
          status: 200,
          headers: {
            "Content-Type": "text/html"
          }
        })
    }
  });
  const headers = {};
  for (const [name, value] of webRes.headers) {
    headers[name] = [value];
  }
  if (webRes.headers.has('set-cookie')) {
		const header = /** @type {string} */ (webRes.headers.get('set-cookie'));
		// @ts-expect-error
		headers['set-cookie'] =  splitCookiesString(header);
	}

  res.statusMessage = webRes.statusText;
  res.writeHead(
    webRes.status,
    webRes.statusText,
    headers
  );

  if (webRes.body) {
    res.end(await webRes.text());
  } else {
    res.end();
  }
}

/*!
 * Original code by Remix Sofware Inc
 * MIT Licensed, Copyright(c) 2021 Remix software Inc, see LICENSE.remix.md for details
 *
 * Credits to the Remix team:
 * https://github.com/remix-run/remix/blob/main/packages/remix-netlify/server.ts
 */
function createRequest(req) {
  let host = req.headers["x-forwarded-host"] || req.headers["host"];
  let protocol = req.headers["x-forwarded-proto"] || "https";

  const params = new Proxy(new URLSearchParams(req.headers["x-now-route-matches"]), {
    get: (searchParams, prop) => searchParams.get(prop),
  })

  const url = new URL(params.path, `${protocol}://${host}`);

  let init = {
    method: req.method,
    headers: createHeaders(req.headers)
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req;
    init.duplex = 'half';
  }

  return new Request(url.href, init);
}

function createHeaders(requestHeaders) {
  let headers = new Headers();

  for (let key in requestHeaders) {
    let header = requestHeaders[key];
    if (Array.isArray(header)) {
      for (let value of header) {
        headers.append(key, value);
      }
    } else {
      headers.append(key, header);
    }
  }

  return headers;
}
