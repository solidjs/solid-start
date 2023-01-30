import type { APIGatewayProxyEvent, APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { splitCookiesString } from 'solid-start/node/fetch.js';
import 'solid-start/node/globals.js';
import { type FetchEvent } from 'solid-start';
// @ts-ignore
import { default as manifest } from '../../dist/client/route-manifest.json';
// @ts-ignore
import { default as _server } from './entry-server.js';
const server = _server as (event:FetchEvent)=>Promise<Response>;

export async function handler(
  event:APIGatewayProxyEvent|APIGatewayProxyEventV2
):Promise<APIGatewayProxyResult> {
  const clientAddress =
    (event as APIGatewayProxyEvent).requestContext.identity
    ? (event as APIGatewayProxyEvent).requestContext.identity.sourceIp
    : (event as APIGatewayProxyEventV2).requestContext.http.sourceIp;
  const response = await server({
    request: createRequest(event),
    clientAddress,
    locals: {},
    env: { manifest } as Env,
  });
  const headers = {}
  for (const [name, value] of response.headers) {
    headers[name] = value;
  }
  if (response.headers.has('set-cookie')) {
    const header = /** @type {string} */ (response.headers.get('set-cookie'));
    headers['set-cookie'] = splitCookiesString(header);
  }
  return {
    statusCode: response.status,
    headers: headers,
    body: await response.text(),
  }
}

function createRequest(event:APIGatewayProxyEvent|APIGatewayProxyEventV2) {
  const url = new URL(
    (event as APIGatewayProxyEvent).path
    || (event as APIGatewayProxyEventV2).rawPath,
    `https://${event.requestContext.domainName}`
  );
  const headers = new Headers();
  for (const [key, _value] of Object.entries(event.headers)) {
    const value = _value as string;
    headers.append(key, value);
  }
  const method =
    (event as APIGatewayProxyEvent).httpMethod
    || (event as APIGatewayProxyEventV2).requestContext.http.method;
  const init:RequestInit = {
    method,
    headers,
  };
  if (method !== 'GET' && method !== 'HEAD' && event.body) {
    init.body =
      event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString()
      : event.body;
  }
  return new Request(url.href, init);
}
