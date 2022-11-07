import { createResource, For, Show } from "solid-js";
import { A, unstable_island, useParams } from "solid-start";
import { getYouTubeVideo } from "~/services/tmdbAPI";
import { useMovie } from "../useMovie";
import "./Videos.scss";

const Video = unstable_island(() => import("./Videos"));

export default function Videos() {
  const params = useParams();
  const data = useMovie(params);

  const getVideoTypes = (): string[] => {
    return data()
      ?.item.videos.results.map(video => video.type)
      .filter((video, index, arr) => arr.indexOf(video) === index);
  };
  const videos = data()?.item.videos.results;

  const getVideos = async videos => {
    const ids = videos?.map(video => video.key).join(",");

    let activeVideos = {};

    videos?.forEach(video => {
      const videoDetails = {
        src: `https://www.youtube.com/embed/${video.key}?rel=0&showinfo=0&autoplay=1`,
        url: `https://www.youtube.com/watch?v=${video.key}`,
        width: 320,
        height: 180,
        thumb: `https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`,
        name: video.name,
        type: video.type
      };
      activeVideos[video.key] = videoDetails;
    });

    const response = await getYouTubeVideo(ids);
    for (let index = 0; index < videos?.length; index++) {
      if (response.items[index]) {
        activeVideos[videos[index].key].duration = response.items[index].contentDetails.duration;
      }
    }
    return Object.values(activeVideos);
  };

  const [videoData] = createResource(() => data()?.item.videos.results, getVideos);

  return (
    <main>
      <div class="spacing">
        <div class="videos__head">
          <Show when={data()?.item.videos.results?.length > 1}>
            <select>
              <option value="all">All</option>
              <For each={getVideoTypes()}>
                {videoType => <option value={videoType}>{videoType}</option>}
              </For>
            </select>
          </Show>
          <strong class="videos__count">{data()?.item.videos.results?.length} Videos</strong>
        </div>
        <div class="videos__items">
          <For each={videoData()}>{video => <VideoItem video={video} />}</For>
        </div>
      </div>
    </main>
  );
}

function VideoItem(props) {
  return (
    <div class="videos-item">
      <A class="videos-item__link" href={props.video.url}>
        <div class="videos-item__img">
          <img
            width={props.video.width}
            height={props.video.height}
            src={props.video.thumb}
            sizes={}
          />
          <div class="videos-item__duration">{props.video.duration}</div>
          {/* <CirclePlayIcon class="videos-item__play" /> */}
        </div>
        <h2 class="videos-item__name">{props.video.name}</h2>
        <h2 class="videos-item__type">{props.video.type}</h2>
      </A>
    </div>
  );
}
