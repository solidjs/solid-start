import { json } from "solid-start";
import { DurableObjectContext } from "solid-start/durable-object";

export type Note = {
  id: string;
  title: string;
  body: string;
  updated_at: string;
};

export default async function notesDB(req: Request, ctx: DurableObjectContext) {
  const url = new URL(req.url);
  // Durable Object storage is automatically cached in-memory, so reading the
  // same key every request is fast. (That said, you could also store the
  // value in a class member if you prefer.)

  switch (url.pathname) {
    case "/":
      let d = [...(await ctx.storage.list()).values()];
      return json(d);
    case "/get":
      let id = url.searchParams.get("id");
      if (!id) return json({ error: "no id" });
      let note = await ctx.storage.get(id);
      if (!note) return json({ error: "no note" });
      return json(note);
    case "/update":
      const value = await ctx.storage.get<{}>(url.searchParams.get("id"));
      await ctx.storage.put(url.searchParams.get("id"), {
        id: url.searchParams.get("id"),
        ...value,
        ...((await req.json()) as {})
      });
      return json({});
    case "/delete":
      await ctx.storage.delete(url.searchParams.get("id"));
      return json({});
    default:
      return new Response("Not found", { status: 404 });
  }

  // You do not have to worry about a concurrent request having modified the
  // value in storage because "input gates" will automatically protect against
  // unwanted concurrency. So, read-modify-write is safe. For more details,
  // refer to: https://blog.cloudflare.com/durable-objects-easy-fast-correct-choose-three/
  // await this.state.storage.put("value", value);
}
