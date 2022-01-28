import { createResource } from "solid-js";
import { RouteDataFunc } from "solid-app-router";
import fetchAPI from "../../lib/api";
import server from "solid-start/server";

const StoryData: RouteDataFunc = props => {
  const [story] = createResource(() => `item/${props.params.id}`, server(fetchAPI));
  return story;
};

export default StoryData;
