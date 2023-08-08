import { createServerData$ } from "solid-start/server";

export function useNote(params: { note: string }) {
  return createServerData$(
    async ([selectedId], { env }) => {
      const data = await env.notes.get(selectedId);

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
