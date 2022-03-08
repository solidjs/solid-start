import { createCookieSessionStorageFactory } from "./cookieStorage";
import { createCookieFactory } from "./cookies";
import { createSessionStorageFactory } from "./sessions";
// TODO: Once node v16 is available on AWS we should use these instead of the
// global `sign` and `unsign` functions.
//import { sign, unsign } from "./cookieSigning";
import "./cookieSigning";
import { sign, unsign } from "./cookieSigning";
import { createMemorySessionStorageFactory } from "./memoryStorage";

export const createCookie = createCookieFactory({ sign: sign, unsign: unsign });
export const createCookieSessionStorage = createCookieSessionStorageFactory(createCookie);
export const createSessionStorage = createSessionStorageFactory(createCookie);
export const createMemorySessionStorage = createMemorySessionStorageFactory(createSessionStorage);
