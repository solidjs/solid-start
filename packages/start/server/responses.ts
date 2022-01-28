import { RequestContext } from "../components/StartServer";

export class FormError extends Error {
  formError: string;
  fields: {};
  fieldErrors: { [key: string]: string };
  constructor(
    message: string,
    { fieldErrors = {}, form, fields }: { fieldErrors?: {}; form?: FormData; fields?: {} } = {}
  ) {
    super(message);
    this.formError = message;
    this.name = "FormError";
    this.fields = fields || Object.fromEntries(form?.entries() ?? []) || {};
    this.fieldErrors = fieldErrors;
  }
}

export function respondWith(
  ctx: RequestContext,
  data: Response | Error | FormError | string | object,
  responseType: "throw" | "return"
) {
  if (data instanceof Response) {
    if (data.status === 302 && ctx.request.headers.get("x-solidstart-origin") === "client") {
      data.headers.set("x-solidstart-origin", "server");
      data.headers.set("x-solidstart-location", data.headers.get("Location"));
      data.headers.set("x-solidstart-Response-Type", responseType);
      data.headers.set("x-solidstart-Content-type", "response");
      return new Response(null, {
        status: 204,
        headers: data.headers
      });
    } else {
      data.headers.set("x-solidstart-Response-Type", responseType);
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
