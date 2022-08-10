/*!
 * Original code by Remix Sofware Inc
 * MIT Licensed, Copyright(c) 2021 Remix software Inc, see LICENSE.remix.md for details
 * 
 * Credits to the Remix team:
 * https://github.com/remix-run/remix/blob/main/packages/remix-server-runtime/cookieSigning.ts
 */

export type InternalSignFunctionDoNotUseMe = (value: string, secret: string) => Promise<string>;

export type InternalUnsignFunctionDoNotUseMe = (
  cookie: string,
  secret: string
) => Promise<string | false>;

const encoder = /*#__PURE__*/new TextEncoder();

export const sign: InternalSignFunctionDoNotUseMe = async (value, secret) => {
  let key = await createKey(secret, ["sign"]);
  let data = encoder.encode(value);
  let signature = await crypto.subtle.sign("HMAC", key, data);
  let hash = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=+$/, "");

  return value + "." + hash;
};

export const unsign: InternalUnsignFunctionDoNotUseMe = async (signed, secret) => {
  let index = signed.lastIndexOf(".");
  let value = signed.slice(0, index);
  let hash = signed.slice(index + 1);

  let key = await createKey(secret, ["verify"]);
  let data = encoder.encode(value);
  let signature = byteStringToUint8Array(atob(hash));
  let valid = await crypto.subtle.verify("HMAC", key, signature, data);

  return valid ? value : false;
};

async function createKey(secret: string, usages: CryptoKey["usages"]): Promise<CryptoKey> {
  let key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages
  );

  return key;
}

function byteStringToUint8Array(byteString: string): Uint8Array {
  let array = new Uint8Array(byteString.length);

  for (let i = 0; i < byteString.length; i++) {
    array[i] = byteString.charCodeAt(i);
  }

  return array;
}

// export async function sign(value: string, secret: string): Promise<string> {
//     const ec = new TextEncoder();
//     const signature =
//       await crypto.subtle.sign('RSASSA-PKCS1-v1_5', secret, ec.encode(value));
//     return new TextDecoder().decode(signature);
//   }

//   async function verify(key, signature, data) {
//     const ec = new TextEncoder();
//     const verified =
//       await subtle.verify(
//         'RSASSA-PKCS1-v1_5',
//         key,
//         signature,
//         ec.encode(data));
//     return verified;
//   }
// }

// export async function unsign(value: string, secret: string): Promise<string | false> {
//   return cookie.unsign(value, secret);
// }
