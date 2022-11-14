import { createRouteData } from "solid-start";
import { getMovie, getYouTubeVideo } from "~/services/tmdbAPI";
const getVideos = async videos => {
  if (!videos) return [];
  const ids = videos?.map(video => video.key).join(",");

  let videosData = {};

  const response = await getYouTubeVideo(ids);
  for (let index = 0; index < videos?.length; index++) {
    if (response.items[index]) {
      const video = videos[index];
      const videoDetails = {
        src: `https://www.youtube.com/embed/${video.key}?rel=0&showinfo=0&autoplay=1`,
        url: `https://www.youtube.com/watch?v=${video.key}`,
        width: 320,
        height: 180,
        thumb: `https://img.youtube.com/vi/${video.key}/mqdefault.jpg`,
        name: video.name,
        type: video.type,
        duration: response.items[index].contentDetails.duration
      };
      videosData[video.key] = videoDetails;
    }
  }
  return Object.values(videosData) as any[];
};
export function useVideos(params: any) {
  return createRouteData(
    async id => {
      try {
        const movieInfo = await getMovie(id);
        if (movieInfo.adult) {
          throw new Error("Data not available");
        }

        const item = await getVideos(movieInfo?.videos.results);
        return { item };
      } catch {
        throw new Error("Data not available");
      }
    },
    {
      key: () => params.movieId
    }
  );
}
