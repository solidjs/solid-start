import { createMemo, createSignal, For, onMount, Show } from "solid-js";

export default function Videos(props) {
  const [activeFilter, setActiveFilter] = createSignal("all");

  const getVideoTypes = (): string[] => {
    return props.videos
      ?.map(video => video.type)
      .filter((video, index, arr) => arr.indexOf(video) === index);
  };

  onMount(() => {
    if (props.videos) {
      console.log(props.videos);
    }
  });

  const filteredVideos = createMemo(() => {
    if (!Array.isArray(props.videos)) return [];

    return props.videos?.filter(key =>
      activeFilter() === "all" ? true : (key as any).type === activeFilter()
    );
  });

  const onFilterChange = e => {
    setActiveFilter(e.currentTarget.value);
  };

  return (
    <main>
      <div class="spacing">
        <div class="videos__head">
          <Show when={props.videos?.length > 1}>
            <select name="filterVal" value="all" onChange={onFilterChange}>
              <option value="all">All</option>
              <For each={getVideoTypes()}>
                {videoType => <option value={videoType}>{videoType}</option>}
              </For>
            </select>
          </Show>
          <strong class="videos__count">{props.videos?.length} Videos</strong>
        </div>
        <div class="videos__items">
          <Show when={props.videos}>
            <For each={filteredVideos()}>{video => <VideoItem video={video} />}</For>
          </Show>
        </div>
      </div>
    </main>
  );
}

function VideoItem(props) {
  const getSeconds = duration => {
    let a = duration?.match(/\d+/g);
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
      <a class="videos-item__link" href={props.video.url}>
        <div class="videos-item__img">
          <img
            width={props.video.width + "px"}
            height={props.video.height + "px"}
            src={props.video.thumb}
            alt={props.video.name}
          />
          <div class="videos-item__duration">{formatDuration(props.video?.duration)}</div>
          <CirclePlayIcon />
        </div>
        <h2 class="videos-item__name">{props.video.name}</h2>
        <h2 class="videos-item__type">{props.video.type}</h2>
      </a>
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