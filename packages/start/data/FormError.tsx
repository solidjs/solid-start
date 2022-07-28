export class ServerError extends Error {
  constructor(message: string, { stack }: { stack?: string } = {}) {
    super(message);
    this.name = "ServerError";
    if (stack) {
      this.stack = stack;
    }
  }
}

export class FormError extends ServerError {
  formError: string;
  fields: {};
  fieldErrors: { [key: string]: string };
  constructor(
    message: string,
    {
      fieldErrors = {},
      form,
      fields,
      stack
    }: { fieldErrors?: {}; form?: FormData; fields?: {}; stack?: string } = {}
  ) {
    super(message);
    this.formError = message;
    this.name = "FormError";
    this.fields =
      fields || Object.fromEntries(typeof form !== "undefined" ? form.entries() : []) || {};
    this.fieldErrors = fieldErrors;
  }
}
