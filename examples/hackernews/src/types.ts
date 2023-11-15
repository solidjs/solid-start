export interface Comment {
  user: string;
  time_ago: string;
  content: string;
  comments: Comment[];
}

export interface Story {
  id: string;
  points: string;
  url: string;
  title: string;
  domain: string;
  type: string;
  time_ago: string;
  user: string;
  comments_count: number;
  comments: Comment[];
}

export interface User {
  error: string;
  id: string;
  created: string;
  karma: number;
  about: string;
}

export type StoryTypes = "top" | "new" | "show" | "ask" | "job";
