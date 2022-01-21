export default function server(fn) {
  return fn;
}

server.fetch =
  (s, serverIndex) =>
  (...args) =>
    fetch(`/__server_module${s}`, {
      method: "POST",
      body: JSON.stringify({
        filename: s,
        index: serverIndex,
        args: args
      }),
      headers: {
        "Content-Type": "application/json"
      }
    }).then(r => r.json());

const handlers = new Map();

server.registerHandler = function (path, index, handler) {
  // console.log(path, handler);
  handlers.set(path + "__" + index, handler);
};

server.getHandler = function (path, index) {
  return handlers.get(path + "__" + index);
};
