import { isServer } from "solid-js/web";

export default function server(fn) {
  return fn;
}

if (!isServer) {
  server.fetch =
    hash =>
    (...args) =>
      fetch(`/_m${hash}`, {
        method: "POST",
        body: JSON.stringify([hash, args]),
        headers: {
          "Content-Type": "application/json"
        }
      }).then(r => r.json());
}

if (isServer) {
  const handlers = new Map();

  server.registerHandler = function (hash, handler) {
    handlers.set(hash, handler);
  };

  server.getHandler = function (hash) {
    console.log(handlers, hash);
    return handlers.get(hash);
  };
}
