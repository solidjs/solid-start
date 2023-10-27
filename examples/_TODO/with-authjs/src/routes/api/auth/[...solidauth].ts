import { SolidAuth } from "@solid-auth/base";
import { authOptions } from "~/server/auth";

export const { GET, POST } = SolidAuth(authOptions);
