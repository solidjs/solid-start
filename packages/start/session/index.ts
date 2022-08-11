/*!
 * Original code by Remix Sofware Inc
 * MIT Licensed, Copyright(c) 2021 Remix software Inc, see LICENSE.remix.md for details
 * 
 * Credits to the Remix team:
 * https://github.com/remix-run/remix/blob/main/packages/remix-server-runtime
 */

import { createCookieFactory } from "./cookies";
import { createCookieSessionStorageFactory } from "./cookieStorage";
import { createSessionStorageFactory } from "./sessions";
import "./cookieSigning";
import { sign, unsign } from "./cookieSigning";
import { createMemorySessionStorageFactory } from "./memoryStorage";

export * from "./cookie";
export const createCookie = createCookieFactory({ sign: sign, unsign: unsign });
export const createCookieSessionStorage = createCookieSessionStorageFactory(createCookie);
export const createSessionStorage = createSessionStorageFactory(createCookie);
export const createMemorySessionStorage = createMemorySessionStorageFactory(createSessionStorage);
