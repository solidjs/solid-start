import { cache } from "@solidjs/router";
import { Story, StoryTypes, User } from "~/types";
import fetchAPI from "./fetch";

const mapStories = {
  top: "news",
  new: "newest",
  show: "show",
  ask: "ask",
  job: "jobs"
} as const;

export const getStories = cache(async (type: StoryTypes, page: number): Promise<Story[]> => fetchAPI(`${mapStories[type]}?page=${page}`), "stories");
export const getStory = cache(async (id: string): Promise<Story> => fetchAPI(`item/${id}`), "story");
export const getUser = cache(async (id: string): Promise<User> => fetchAPI(`user/${id}`), "user");
