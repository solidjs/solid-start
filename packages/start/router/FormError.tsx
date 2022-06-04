export class FormError extends Error {
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
    if (stack) {
      this.stack = stack;
    }
  }
}
