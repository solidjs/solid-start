import { createDurableObject } from "solid-start/durable-object";
import { createHandler, renderAsync, StartServer } from "solid-start/entry-server";
import notesDB, { Note } from "./db";

export const db = createDurableObject(notesDB);

declare global {
  interface Env {
    notes: {
      list(): Promise<Note[]>;
      get(id: string): Promise<{ error?: string } & Note>;
      update(id: string, title: string, body: string): Promise<Response>;
      create(title: string, body: string): Promise<string>;
      delete(id: string): Promise<Response>;
    };
  }
}

export default createHandler(
  ({ forward }) =>
    event => {
      event.env.notes = {
        list: async () => {
          return (
            await event.env.db.get(event.env.db.idFromName("notes")).fetch("https://db.notes/")
          ).json<Note[]>();
        },
        get: async id => {
          return (
            await event.env.db
              .get(event.env.db.idFromName("notes"))
              .fetch(`https://db.notes/get?id=${id}`)
          ).json<Note>();
        },
        update: async (id, title, body) => {
          return await event.env.db
            .get(event.env.db.idFromName("notes"))
            .fetch(`https://db.notes/update?id=${encodeURIComponent(id)}`, {
              body: JSON.stringify({
                title,
                body,
                updated_at: new Date().toISOString()
              }),
              method: "POST"
            });
        },
        delete: async id => {
          return await event.env.db
            .get(event.env.db.idFromName("notes"))
            .fetch(`http://notes/delete?id=${id}`);
        },
        create: async (title, body) => {
          let id = `note_${Math.round(Math.random() * 100000)}`;
          await event.env.db
            .get(event.env.db.idFromName("notes"))
            .fetch(`https://db.notes/update?id=${encodeURIComponent(id)}`, {
              body: JSON.stringify({
                title,
                body,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }),
              method: "POST"
            });
          return id;
        }
      };
      return forward(event);
    },
  renderAsync(event => <StartServer event={event} />)
);
