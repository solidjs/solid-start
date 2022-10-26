import { Outlet } from "solid-start";
import { createServerData$ } from "solid-start/server";

export function routeData({ params }) {
  return createServerData$(
    async ([selectedId], { env }) => {
      const db = env.DO.get(env.DO.idFromName("notes"));
      const data = await (
        await db.fetch(`http://notes/get?id=${selectedId}`)
      ).json<{ error?: string; id: string; body: string; title: string; updated_at: string }>();

      if (data.error) {
        return null;
      }

      return data;
    },
    {
      key: () => [params.note]
    }
  );
}
export default function NoteLayout() {
  return <Outlet />;
}
