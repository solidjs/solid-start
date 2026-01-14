
export const BODY_FORMAT_KEY = "X-Start-Type";

export const BODY_FORMAL_FILE = "__START__";

export const enum BodyFormat {
  Seroval = "0",
  String = "1",
  FormData = "2",
  URLSearchParams = "3",
  Blob = "4",
  File = "5",
  ArrayBuffer = "6",
  Uint8Array = "7",
}
