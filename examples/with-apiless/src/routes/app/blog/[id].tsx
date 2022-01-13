import { blogPostBody, BlogPostBody } from "~/components/BlogPostBody";
import { blogPostHeader, BlogPostHeader } from "~/components/BlogPostHeader";
import { Blogs } from "../../../components/data";
import { defineQuery, useQuery } from "~/solid-query";
import { delay } from "../../utils";
import { useData, useParams } from "solid-app-router";
import { useRouterData } from "solid-start/router";

export const blogQuery = defineQuery(async ({ id }: { id: string }, get) => {
  await delay(1000);
  const blog = Blogs[id];

  return {
    blog,
    blogPostHeader: await get(blogPostHeader, blog),
    blogPostBody: await get(blogPostBody, blog)
  };
});

export const data = () => {
  console.log("hello");
  return {
    data: "hello"
  };
};

export default function BlogPost() {
  const params = useParams();
  const [data] = useQuery(blogQuery, () => ({
    id: params.id
  }));

  const d = useRouterData<"/app/blog/[id]">();

  // console.log(d());

  return (
    <div>
      <BlogPostHeader blogPost={data()?.blogPostHeader} />
      <BlogPostBody blogPost={data()?.blogPostBody} />
    </div>
  );
}
