import { Title } from "@solidjs/meta";
import { HttpStatusCode } from "@solidjs/start";
import { useLang, LangLink } from "~/lang/core";

export default function NotFound() {
  const { messages } = useLang();

  return (
    <>
      <Title>Error 404</Title>
      <HttpStatusCode code={404} />

      <div class="container">
        {/* 404 Error Display */}
        <h1>
          404
        </h1>

        <h2>
          {messages().error_404()}
        </h2>

        {/* Action buttons */}
        <div>
          <LangLink href="/">
            ← {messages().menu_home()}
          </LangLink>
          <a href="https://start.solidjs.com" target="_blank" rel="noopener noreferrer">
            {messages().learn_solidstart()}
          </a>
        </div>
      </div>
    </>
  );
}
