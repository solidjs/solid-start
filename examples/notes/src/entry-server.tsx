import { json } from "solid-start";
import { createHandler, renderStream, StartServer } from "solid-start/entry-server";

export class NotesDB {
  storage: DurableObjectStorage;
  dolocation: string;

  state: DurableObjectState;
  constructor(state: DurableObjectState) {
    // We will put the WebSocket objects for each client into `websockets`
    this.storage = state.storage;
    this.dolocation = "";
    this.state = state;
  }
  fetch(req: Request) {
    return NotesDB.fetch(req, this.state);
  }
  static async fetch(req: Request, state: DurableObjectState) {
    const url = new URL(req.url);
    // Durable Object storage is automatically cached in-memory, so reading the
    // same key every request is fast. (That said, you could also store the
    // value in a class member if you prefer.)

    await new Promise(r => setTimeout(r, 500));

    switch (url.pathname) {
      case "/":
        let d = [...(await state.storage.list()).values()];
        console.log(d);
        return json(d);
      case "/get":
        let id = url.searchParams.get("id");
        if (!id) return json({ error: "no id" });
        let note = await state.storage.get(id);
        if (!note) return json({ error: "no note" });
        return json(note);
      case "/update":
        const value = await state.storage.get(url.searchParams.get("id"));
        await state.storage.put(url.searchParams.get("id"), {
          id: url.searchParams.get("id"),
          ...value,
          ...(await req.json())
        });
        return json({});
      case "/delete":
        await state.storage.delete(url.searchParams.get("id"));
        return json({});
        // Just serve the current value.
        break;
      default:
        return new Response("Not found", { status: 404 });
    }

    // You do not have to worry about a concurrent request having modified the
    // value in storage because "input gates" will automatically protect against
    // unwanted concurrency. So, read-modify-write is safe. For more details,
    // refer to: https://blog.cloudflare.com/durable-objects-easy-fast-correct-choose-three/
    // await this.state.storage.put("value", value);
  }
}

export default createHandler(
  ({ forward }) =>
    event => {
      if (!event.env.KV) {
        let data = {};
        event.env.KV = {
          data,
          async get(key, type) {
            if (type == "json") return JSON.parse(this.data[key]);
            return this.data[key];
          },
          async put(key, value) {
            this.data[key] = value;
          },
          async delete(key) {
            delete this.data[key];
          },
          async list() {
            return {
              keys: Object.keys(this.data).map(k => ({ name: k })),
              list_complete: true
            };
          },
          async getWithMetadata(key, type) {
            if (type == "json") return JSON.parse(this.data[key]);
            return this.data[key];
          }
        };
      }
      return forward(event);
    },
  renderStream(event => <StartServer event={event} />)
);
