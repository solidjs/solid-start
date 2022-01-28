import { createResource } from "solid-js";
import { RouteDataFunc } from "solid-app-router";
import fetchAPI from "../lib/api";
import server from "solid-start/server";

const mapStories = {
  top: "news",
  new: "newest",
  show: "show",
  ask: "ask",
  job: "jobs"
} as const;

const StoriesData: RouteDataFunc = ({ location, params }) => {
  const page = () => +location.query.page || 1;
  const type = () => params.stories || "top";

  const [stories] = createResource(() => `${mapStories[type()]}?page=${page()}`, server(fetchAPI));

  return { type, stories, page };
};

export default StoriesData;
