import { SolidAuth } from "@solid-mediakit/auth";
import { authOptions } from "~/server/auth";

export const { GET, POST } = SolidAuth(authOptions);
