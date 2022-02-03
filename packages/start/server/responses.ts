import { FormError } from "../form";
import { RequestContext } from "../components/StartServer";

/**
 * A JSON response. Converts `data` to JSON and sets the `Content-Type` header.
 */
export function json<Data>(data: Data, init: number | ResponseInit = {}): Response {
  let responseInit: any = init;
  if (typeof init === "number") {
    responseInit = { status: init };
  }

  let headers = new Headers(responseInit.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }

  return new Response(JSON.stringify(data), {
    ...responseInit,
    headers
  });
}

/**
 * A redirect response. Sets the status code and the `Location` header.
 * Defaults to "302 Found".
 */
export function redirect(
  url: string,
  // we use 204 no content to signal that the response body is empty
  // and the X-Location header should be used instead to do the redirect client side
  init: number | ResponseInit = 302
): Response {
  let responseInit = init;
  if (typeof responseInit === "number") {
    responseInit = { status: responseInit };
  } else if (typeof responseInit.status === "undefined") {
    responseInit.status = 302;
  }

  return new Response(null, {
    ...responseInit,
    headers: {
      ...responseInit.headers,
      "X-SolidStart-Location": url,
      Location: url
    }
  });
}

export function isResponse(value: any): value is Response {
  return (
    value != null &&
    typeof value.status === "number" &&
    typeof value.statusText === "string" &&
    typeof value.headers === "object" &&
    typeof value.body !== "undefined"
  );
}

const redirectStatusCodes = new Set([301, 302, 303, 307, 308]);

export function isRedirectResponse(response: Response): boolean {
  return redirectStatusCodes.has(response.status);
}

export function respondWith(
  ctx: RequestContext,
  data: Response | Error | FormError | string | object,
  responseType: "throw" | "return"
) {
  if (data instanceof Response) {
    if (isRedirectResponse(data) && ctx.request.headers.get("x-solidstart-origin") === "client") {
      data.headers.set("x-solidstart-origin", "server");
      data.headers.set("x-solidstart-location", data.headers.get("Location"));
      data.headers.set("x-solidstart-response-type", responseType);
      data.headers.set("x-solidstart-content-type", "response");
      return new Response(null, {
        status: 204,
        headers: data.headers
      });
    } else {
      data.headers.set("x-solidstart-Response-type", responseType);
      data.headers.set("x-solidstart-Content-type", "response");
      return data;
    }
  } else if (data instanceof FormError) {
    return new Response(
      JSON.stringify({
        error: {
          message: data.message,
          stack: data.stack,
          formError: data.formError,
          fields: data.fields,
          fieldErrors: data.fieldErrors
        }
      }),
      {
        status: 400,
        headers: {
          "X-SolidStart-Response-Type": responseType,
          "X-SolidStart-Content-Type": "form-error"
        }
      }
    );
  } else if (data instanceof Error) {
    return new Response(
      JSON.stringify({
        error: {
          message: data.message,
          stack: data.stack,
          status: (data as any).status
        }
      }),
      {
        status: (data as any).status || 500,
        headers: {
          "X-SolidStart-Response-Type": responseType,
          "X-SolidStart-Content-Type": "error"
        }
      }
    );
  } else if (typeof data === "string") {
    return new Response(data, {
      status: 200,
      headers: {
        "X-SolidStart-Response-Type": responseType,
        "X-SolidStart-Content-Type": "string"
      }
    });
  } else if (typeof data === "object") {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-type": "application/json",
        "X-SolidStart-Response-Type": responseType,
        "X-SolidStart-Content-Type": "json"
      }
    });
  }

  return new Response("null", {
    status: 200,
    headers: {
      "Content-type": "application/json",
      "X-SolidStart-Content-Type": "json",
      "X-SolidStart-Response-Type": responseType
    }
  });
}

export async function parseResponse(request: Request, response: Response) {
  const contentType =
    response.headers.get("X-SolidStart-Content-Type") || response.headers.get("Content-Type");

  if (contentType.includes("json")) {
    return await response.json();
  } else if (contentType.includes("text")) {
    return await response.text();
  } else if (contentType.includes("form-error")) {
    const data = await response.json();
    return new FormError(data.error.message, { fieldErrors: data.error.fieldErrors });
  } else if (contentType.includes("error")) {
    const data = await response.json();
    return new Error(data.error.message);
  } else if (contentType.includes("response")) {
    if (response.status === 204 && response.headers.get("X-SolidStart-Location")) {
      return redirect(response.headers.get("X-SolidStart-Location"));
    }
    return response;
  }
}
