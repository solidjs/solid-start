import { Request as BaseNodeRequest, Headers } from "undici";
import { FormData } from "undici";

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

class NodeRequest extends BaseNodeRequest {
  constructor(input, init) {
    if (init && init.body instanceof FormData) {
      init = {
        ...init,
        body: init.body
      };
    }

    super(input, init);

    this._body = init.data;
  }

  _body;

  async json() {
    return JSON.parse(await this.text());
  }

  async text() {
    return await new Promise((resolve, reject) => {
      let chunks = [];
      this._body.on("data", chunk => {
        chunks.push(chunk);
      });
      this._body.on("end", () => {
        resolve(Buffer.concat(chunks).toString());
      });
      this._body.on("error", reject);
    });
  }
}

export function createRequest(req) {
  let origin = `${req.protocol}://${req.headers.host}`;
  let url = new URL(req.url, origin);

  let init = {
    method: req.method,
    headers: createHeaders(req.headers),
    // will be read as body by NodeRequest
    data: req.method === "POST" ? req : null
  };

  return new NodeRequest(url.href, init);
}
