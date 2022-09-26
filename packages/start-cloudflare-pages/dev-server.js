/*!
 * Original code by MrBBot
 * MIT Licensedm Copyright (c) 2021 MrBBot, see LICENSE.miniflare.md for details
 */

import { createRequestListener } from "@miniflare/http-server";
import { coupleWebSocket } from "@miniflare/web-sockets";
import assert from "assert";
import http from "http";
import net from "net";
import { URL } from "url";

async function writeResponse(response, res) {
  var e_1, _a;
  const headers = {};
  // eslint-disable-next-line prefer-const
  for (let [key, value] of response.headers) {
    key = key.toLowerCase();
    if (key === "set-cookie") {
      // Multiple Set-Cookie headers should be treated as separate headers
      // @ts-expect-error getAll is added to the Headers prototype by
      // importing @miniflare/core
      headers["set-cookie"] = response.headers.getAll("set-cookie");
    } else {
      headers[key] = value;
    }
  }
  // Use body's actual length instead of the Content-Length header if set,
  // see https://github.com/cloudflare/miniflare/issues/148. We also might
  // need to adjust this later for live reloading so hold onto it.
  const contentLengthHeader = response.headers.get("Content-Length");
  const contentLength = contentLengthHeader === null ? null : parseInt(contentLengthHeader);
  if (contentLength !== null) headers["content-length"] = contentLength;
  res.writeHead(response.status, headers);
  // `initialStream` is the stream we'll write the response to. It
  // should end up as the first encoder, piping to the next encoder,
  // and finally piping to the response:
  //
  // encoders[0] (initialStream) -> encoders[1] -> res
  //
  // Not using `pipeline(passThrough, ...encoders, res)` here as that
  // gives a premature close error with server sent events. This also
  // avoids creating an extra stream even when we're not encoding.
  let initialStream = res;
  // Response body may be null if empty
  if (response.body) {
    try {
      for (var _b = __asyncValues(response.body), _c; (_c = await _b.next()), !_c.done; ) {
        const chunk = _c.value;
        if (chunk) initialStream.write(chunk);
      }
    } catch (e_1_1) {
      e_1 = { error: e_1_1 };
    } finally {
      try {
        if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
      } finally {
        if (e_1) throw e_1.error;
      }
    }
  }
  initialStream.end();
}

export const DEFAULT_PORT = 8787;
const restrictedWebSocketUpgradeHeaders = ["upgrade", "connection", "sec-websocket-accept"];

export async function createServer(vite, mf, options) {
  var _a, _b;
  const listener = createRequestListener(mf);
  // Setup HTTP server
  const { WebSocketServer } = await import("ws");
  // Setup WebSocket servers
  const webSocketServer = new WebSocketServer({ noServer: true });
  // Add custom headers included in response to WebSocket upgrade requests
  const extraHeaders = new WeakMap();
  webSocketServer.on("headers", (headers, req) => {
    const extra = extraHeaders.get(req);
    extraHeaders.delete(req);
    if (extra) {
      for (const [key, value] of extra) {
        if (!restrictedWebSocketUpgradeHeaders.includes(key.toLowerCase())) {
          headers.push(`${key}: ${value}`);
        }
      }
    }
  });
  (_a = vite.httpServer) === null || _a === void 0
    ? void 0
    : _a.on("upgrade", async (request, socket, head) => {
        var _a;
        // Only interested in pathname so base URL doesn't matter
        const { pathname } = new URL(
          (_a = request.url) !== null && _a !== void 0 ? _a : "",
          "http://localhost"
        );
        if (
          pathname === "/cdn-cgi/mf/reload" ||
          request.headers["sec-websocket-protocol"] === "vite-hmr"
        ) {
          // If this is the for live-reload, handle the request ourselves
          return;
        } else {
          // Otherwise, handle the request in the worker
          const response = await listener(request);
          // Check web socket response was returned
          const webSocket = response === null || response === void 0 ? void 0 : response.webSocket;
          if (
            (response === null || response === void 0 ? void 0 : response.status) === 101 &&
            webSocket
          ) {
            // Accept and couple the Web Socket
            extraHeaders.set(request, response.headers);
            webSocketServer.handleUpgrade(request, socket, head, ws => {
              void coupleWebSocket(ws, webSocket);
              webSocketServer.emit("connection", ws, request);
            });
            return;
          }
          // Otherwise, we'll be returning a regular HTTP response
          const res = new http.ServerResponse(request);
          // `socket` is guaranteed to be an instance of `net.Socket`:
          // https://nodejs.org/api/http.html#event-upgrade_1
          assert(socket instanceof net.Socket);
          res.assignSocket(socket);
          // If no response was provided, or it was an "ok" response, log an error
          if (!response || (200 <= response.status && response.status < 300)) {
            res.writeHead(500);
            res.end();
            mf.log.error(
              new TypeError(
                "Web Socket request did not return status 101 Switching Protocols response with Web Socket"
              )
            );
            return;
          }
          // Otherwise, send the response as is (e.g. unauthorised),
          // always disabling live-reload as this is a WebSocket upgrade
          await writeResponse(response, res);
        }
      });
  const reloadListener = () => {
    // Close all existing web sockets on reload
    for (const ws of webSocketServer.clients) {
      ws.close(1012, "Service Restart");
    }
  };
  mf.addEventListener("reload", reloadListener);
  (_b = vite.httpServer) === null || _b === void 0
    ? void 0
    : _b.on("close", () => mf.removeEventListener("reload", reloadListener));
  return listener;
}
