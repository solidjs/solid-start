import { BlogPostData } from "./data";
import { createFragment, FragmentData, useFragment } from "../solid-query";

export const blogPostHeader = createFragment(async (blogPost: BlogPostData) => ({
  title: blogPost.title.toUpperCase()
}));

export const BlogPostHeader = (props: { blogPost: FragmentData<typeof blogPostHeader> }) => {
  const data = useFragment(blogPostHeader, () => props.blogPost);

  return <h1>{data()?.title}</h1>;
};
