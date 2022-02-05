
export class FormError extends Error {
  formError: string;
  fields: {};
  fieldErrors: { [key: string]: string; };
  constructor(
    message: string,
    { fieldErrors = {}, form, fields }: { fieldErrors?: {}; form?: FormData; fields?: {}; } = {}
  ) {
    super(message);
    this.formError = message;
    this.name = "FormError";
    this.fields = fields || Object.fromEntries(form?.entries() ?? []) || {};
    this.fieldErrors = fieldErrors;
  }
}
