import { createAsync, query, Route, Router } from "@solidjs/router";
import { For, Suspense } from "solid-js";

const getVideos = query(async () => {
  "use server";
  await new Promise(resolve => setTimeout(resolve, 100));
  return [{ title: "root video", thumb: "/favicon.ico" }];
}, "suspense-back-videos");

const getVideo = query(async () => {
  "use server";
  await new Promise(resolve => setTimeout(resolve, 100));
  return { title: "detail video", thumb: "/favicon.ico" };
}, "suspense-back-video");

export default function Repro2297App() {
  return (
    <Router>
      <Route
        path="/suspense-back"
        component={() => {
          const videos = createAsync(() => getVideos());
          return (
            <Suspense fallback={<p>Loading root...</p>}>
              <For each={videos()}>
                {video => (
                  <a href="/suspense-back/video">
                    <h1>{video.title}</h1>
                    <img alt="root video" src={video.thumb} />
                  </a>
                )}
              </For>
            </Suspense>
          );
        }}
      />
      <Route
        path="/suspense-back/video"
        component={() => {
          const video = createAsync(() => getVideo());
          return (
            <Suspense fallback={<p>Loading detail...</p>}>
              {video()?.title}
              <img alt="detail video" src={video()?.thumb} />
            </Suspense>
          );
        }}
      />
    </Router>
  );
}
