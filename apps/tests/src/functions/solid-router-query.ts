"use server";

import { query } from "@solidjs/router";
import { isServer } from "solid-js/web";

export const testQuery = query(() => isServer, 'testQuery');

