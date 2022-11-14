import { unstable_island, useParams } from "solid-start";
import { useVideos } from "./useVideos";
import "./Videos.scss";

const Video = unstable_island(() => import("./Videos"));

export default function Videos() {
  const params = useParams();
  // const data = useMovie(params);
  const data = useVideos(params);
  // const [videoData, { mutate }] = createResource(() => props.videos, getVideos);

  return <Video videos={data()?.item} />;
}
