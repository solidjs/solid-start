import { Title } from "@solidjs/meta";
import { HttpStatusCode } from "@solidjs/start";
import type { APIEvent } from "@solidjs/start/server";


export const GET = (event: APIEvent) => {
  if (event.request.headers.get("accept") !== "application/json") return;
  return { notFound: "API"}
};

export default function NotFound() {
  return (
    <main>
      <Title>Not Found</Title>
      <HttpStatusCode code={404} />
      <h1>Page Not Found</h1>
      <p>
        Visit{" "}
        <a href="https://start.solidjs.com" target="_blank">
          start.solidjs.com
        </a>{" "}
        to learn how to build SolidStart apps.
      </p>
    </main>
  );
}
