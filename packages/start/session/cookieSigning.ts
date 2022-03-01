// All credits to Remix team:
// https://github.com/remix-run/remix/blob/main/packages/remix-server-runtime/cookieSigning.ts

export type InternalSignFunctionDoNotUseMe = (value: string, secret: string) => Promise<string>;

export type InternalUnsignFunctionDoNotUseMe = (
  cookie: string,
  secret: string
) => Promise<string | false>;

import cookie from "cookie-signature";
export async function sign(value: string, secret: string): Promise<string> {
  return cookie.sign(value, secret);
}

export async function unsign(value: string, secret: string): Promise<string | false> {
  return cookie.unsign(value, secret);
}
