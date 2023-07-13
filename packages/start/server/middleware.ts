import { Middleware as ServerMiddleware } from "../entry-server/StartServer";
import { ContentTypeHeader, XSolidStartContentTypeHeader, XSolidStartOrigin } from "./responses";
import { handleServerRequest, server$ } from "./server-functions/server";
import { FetchEvent, FETCH_EVENT } from "./types";

export const inlineServerFunctions: ServerMiddleware = ({ forward }) => {
  return async (event: FetchEvent) => {
    const url = new URL(event.request.url);

    if (server$.hasHandler(url.pathname)) {
      let contentType = event.request.headers.get(ContentTypeHeader);
      let origin = event.request.headers.get(XSolidStartOrigin);

      let formRequestBody;
      if (
        contentType != null &&
        contentType.includes("form") &&
        !(origin != null && origin.includes("client"))
      ) {
        let [read1, read2] = event.request.body!.tee();
        formRequestBody = new Request(event.request.url, {
          body: read2,
          headers: event.request.headers,
          method: event.request.method,
          duplex: "half"
        });
        event.request = new Request(event.request.url, {
          body: read1,
          headers: event.request.headers,
          method: event.request.method,
          duplex: "half"
        });
      }

      let serverFunctionEvent = Object.freeze({
        request: event.request,
        clientAddress: event.clientAddress,
        locals: event.locals,
        fetch: event.fetch,
        $type: FETCH_EVENT,
        env: event.env
      });

      const serverResponse = await handleServerRequest(serverFunctionEvent);

      if (serverResponse) {
        let responseContentType = serverResponse.headers.get(XSolidStartContentTypeHeader);

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
                new URL(event.request.headers.get("referer")!).pathname +
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

        if (import.meta.env.START_ISLANDS && serverResponse.status === 204) {
          return await event.fetch(serverResponse.headers.get("Location") ?? "", {
            method: "GET",
            headers: {
              "x-solid-referrer": event.request.headers.get("x-solid-referrer")!,
              "x-solid-mutation": event.request.headers.get("x-solid-mutation")!
            }
          });
        }
        return serverResponse as Response;
      }
    }

    const response = await forward(event);

    return response;
  };
};
