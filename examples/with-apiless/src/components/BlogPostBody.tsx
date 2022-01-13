import { BlogPostData } from "./data";
import { createFragment, FragmentData, useFragment } from "../solid-query";

export const blogPostBody = createFragment(async (blogPost: BlogPostData) => ({
  // this could be markdown and we can do async transformations here and suspend on this by surrounding the
  // usage of data in a granular Suspense boundary than the top-level Query one
  body: blogPost.body
}));

export const BlogPostBody = (props: { blogPost: FragmentData<typeof blogPostBody> }) => {
  const data = useFragment(blogPostBody, () => props.blogPost);

  return <p>{data()?.body}</p>;
};
