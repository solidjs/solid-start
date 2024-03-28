import { createWebSocket } from "@solidjs/start/websocket";

export default createWebSocket({
  upgrade(req) {
    console.log(`[ws] upgrading ${req.url}...`)
    return {
      headers: {}
    }
  }

  open(peer) {
    console.log(`[ws] open: ${peer}`);
  },

  message(peer, message) {
    console.log("[ws] message", peer, message);
    if (message.text().includes("ping")) {
      peer.send("pong");
    }
  },

  close(peer, event) {
    console.log("[ws] close", peer, event);
  },

  error(peer, error) {
    console.log("[ws] error", peer, error);
  },
});
