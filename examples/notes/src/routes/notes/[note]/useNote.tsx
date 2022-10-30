import { createServerData$ } from "solid-start/server";
import { Note } from "~/db";

export function useNote(params: Params<"note">) {
  return createServerData$(
    async ([selectedId], { fetch }) => {
      const data = await (
        await fetch(`http://db.notes/get?id=${selectedId}`)
      ).json<{ error?: string } & Note>();

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
