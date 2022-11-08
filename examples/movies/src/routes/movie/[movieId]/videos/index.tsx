import { createResource, createSignal, For, Show } from "solid-js";
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
        thumb: `https://img.youtube.com/vi/${video.key}/mqdefault.jpg`,
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

  const [videoData, { mutate }] = createResource(() => data()?.item.videos.results, getVideos);

  const [activeFilter, setActiveFilter] = createSignal("all");

  const filterVideos = () => {
    mutate(prev =>
      prev.filter((video: any) => (activeFilter() === "all" ? true : video.type === activeFilter()))
    );
  };

  const onFilterChange = e => {
    console.log(e.currentTarget);
    setActiveFilter(e.currentTarget.value);
    filterVideos();
  };

  return (
    <main>
      <div class="spacing">
        <div class="videos__head">
          <Show when={data()?.item.videos.results?.length > 1}>
            <select value={activeFilter()} onChange={onFilterChange}>
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
  const getSeconds = duration => {
    let a = duration.match(/\d+/g);
    if (duration.includes("M") && !duration.includes("H") && !duration.includes("S")) {
      a = [0, a[0], 0];
    }
    if (duration.includes("H") && !duration.includes("M")) {
      a = [a[0], 0, a[1]];
    }
    if (duration.includes("H") && !duration.includes("M") && !duration.includes("S")) {
      a = [a[0], 0, 0];
    }
    duration = 0;
    if (a.length === 3) {
      duration = duration + parseInt(a[0]) * 3600;
      duration = duration + parseInt(a[1]) * 60;
      duration = duration + parseInt(a[2]);
    }
    if (a.length === 2) {
      duration = duration + parseInt(a[0]) * 60;
      duration = duration + parseInt(a[1]);
    }
    if (a.length === 1) {
      duration = duration + parseInt(a[0]);
    }
    return duration;
  };
  const formatDuration = duration => {
    const seconds = getSeconds(duration);
    let secondsLeft = seconds;
    // hours
    // const hours = Math.floor(secondsLeft / 3600);
    secondsLeft = secondsLeft % 3600;
    // mins
    const mins = Math.floor(secondsLeft / 60);
    secondsLeft = secondsLeft % 60;
    // prepend 0 if less than 10
    if (secondsLeft < 10) {
      secondsLeft = `0${secondsLeft}`;
    }
    return `${mins}:${secondsLeft}`;
  };

  return (
    <div class="videos-item">
      <A class="videos-item__link" href={props.video.url}>
        <div class="videos-item__img">
          <img
            width={props.video.width + "px"}
            height={props.video.height + "px"}
            src={props.video.thumb}
            alt={props.video.name}
          />
          <div class="videos-item__duration">{formatDuration(props.video.duration)}</div>
          <CirclePlayIcon />
        </div>
        <h2 class="videos-item__name">{props.video.name}</h2>
        <h2 class="videos-item__type">{props.video.type}</h2>
      </A>
    </div>
  );
}

const CirclePlayIcon = () => {
  return (
    <div class="videos-item__play">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 55 55">
        <circle
          cx="27.5"
          cy="27.5"
          r="26.75"
          fill="none"
          stroke="#fff"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
        ></circle>
        <path
          fill="none"
          stroke="#fff"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M20.97 40.81L40.64 27.5 20.97 14.19v26.62z"
        ></path>
      </svg>
    </div>
  );
};
