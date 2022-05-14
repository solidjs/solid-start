import { Middleware as ServerMiddleware } from "../entry-server/StartServer";
import { RequestContext } from "./types";
import { server, handleServerRequest } from "./serverFunction";

export const inlineServerFunctions: ServerMiddleware = ({ forward }) => {
  return async (ctx: RequestContext) => {
    const url = new URL(ctx.request.url);

    if (server.hasHandler(url.pathname)) {
      let contentType = ctx.request.headers.get("content-type");
      let origin = ctx.request.headers.get("x-solidstart-origin");

      let formRequestBody;
      if (
        contentType != null &&
        contentType.includes("form") &&
        !(origin != null && origin.includes("client"))
      ) {
        let [read1, read2] = ctx.request.body.tee();
        formRequestBody = new Request(ctx.request.url, {
          body: read2,
          headers: ctx.request.headers,
          method: ctx.request.method
        });
        ctx.request = new Request(ctx.request.url, {
          body: read1,
          headers: ctx.request.headers,
          method: ctx.request.method
        });
      }

      const serverResponse = await handleServerRequest(ctx);

      let responseContentType = serverResponse.headers.get("x-solidstart-content-type");

      // when a form POST action is made and there is an error throw,
      // and its a non-javascript request potentially,
      // we redirect to the referrer with the form state and error serialized
      // in the url params for the redicted location
      if (
        formRequestBody &&
        responseContentType !== null &&
        responseContentType.includes("error")
      ) {
        const formData = await formRequestBody.formData();
        let entries = [...formData.entries()];
        return new Response(null, {
          status: 302,
          headers: {
            Location:
              new URL(ctx.request.headers.get("referer")).pathname +
              "?form=" +
              encodeURIComponent(
                JSON.stringify({
                  url: url.pathname,
                  entries: entries,
                  ...(await serverResponse.json())
                })
              )
          }
        });
      }
      return serverResponse;
    }

    const response = await forward(ctx);

    if (ctx.responseHeaders.get("x-solidstart-status-code")) {
      return new Response(response.body, {
        status: parseInt(ctx.responseHeaders.get("x-solidstart-status-code")),
        headers: response.headers
      });
    }

    return response;
  };
};
