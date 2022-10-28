import { createServerData$ } from "solid-start/server";

export function useNote(params: any) {
  return createServerData$(
    async ([selectedId], { env }) => {
      const db = env.DO.get(env.DO.idFromName("notes"));
      const data = await (
        await db.fetch(`http://notes/get?id=${selectedId}`)
      ).json<{ error?: string; id: string; body: string; title: string; updated_at: string }>();

      if (data.error) {
        console.error(data.error);
        throw data.error;
      }

      return data;
    },
    {
      key: () => [params.note]
    }
  );
}
