// Mirrors of @solidjs/web's server-function wire-format markers (the package
// does not export them). The inspector uses them to pick a viewer for a
// captured request/response body. Keep in sync with
// @solidjs/web/server-functions (BODY_FORMAT_HEADER / BodyFormat /
// FILE_FORM_KEY).
export const BODY_FORMAT_KEY = "X-Server-Function-Format";

export const BODY_FORMAT_FILE_KEY = "__server_function_file__";

export const enum BodyFormat {
  Serialized = "0",
  String = "1",
  FormData = "2",
  URLSearchParams = "3",
  Blob = "4",
  File = "5",
  ArrayBuffer = "6",
  Uint8Array = "7",
  Json = "8",
}
