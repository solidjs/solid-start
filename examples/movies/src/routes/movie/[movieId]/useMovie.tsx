import { createRouteData } from "solid-start";
import { getMovie } from "~/services/tmdbAPI";

export function useMovie(params: any) {
  return createRouteData(
    async id => {
      try {
        const item = await getMovie(id);

        if (item.adult) {
          throw new Error("Data not available");
        } else {
          return { item };
        }
      } catch {
        throw new Error("Data not available");
      }
    },
    {
      key: () => params.movieId
    }
  );
}
