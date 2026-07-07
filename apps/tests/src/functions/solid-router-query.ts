"use server";

import { query } from "@solidjs/router";
import { isServer } from "@solidjs/web";

export const testQuery = query(() => isServer, 'testQuery');

