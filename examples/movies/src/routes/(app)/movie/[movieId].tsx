import { createRouteData } from "solid-start";
import { getMovie } from "~/services/tmdbAPI";
import { MoviePage } from "./[movieId]/layout";
export default MoviePage;

export function routeData({ params }) {
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
