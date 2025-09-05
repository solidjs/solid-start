import { Title } from "@solidjs/meta";
import { mountAssets } from "@solidjs/start/client";
import url from "./notFound.css?url";

const NotFound = () => {
  mountAssets([
    {
      tag: "link",
      attrs: {
        href: url,
        rel: "stylesheet"
      }
    }
  ]);

  return (
    <>
      <Title>Not Found</Title>
      <h1>Page Not Found</h1>
      <p>
        Visit{" "}
        <a href="https://start.solidjs.com" target="_blank">
          start.solidjs.com
        </a>{" "}
        to learn how to build SolidStart apps.
      </p>
    </>
  );
};

export default NotFound;
