import { createResource } from "solid-js";
import { RouteDataFunc } from "solid-app-router";
import fetchAPI from "../../lib/api";

const StoryData: RouteDataFunc = (props) => {
  const [story] = createResource(() => `item/${props.params.id}`, fetchAPI);
  return story;
};

export default StoryData;
