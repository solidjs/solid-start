import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as authSchema from "./auth-schema";
import * as schema from "./schema";

if (!process.env.ZERO_UPSTREAM_DB) {
  throw new Error("ZERO_UPSTREAM_DB is not set");
}

export const db = drizzle(process.env.ZERO_UPSTREAM_DB, {
  schema: { ...authSchema, ...schema },
  casing: "snake_case"
});

(async () => {
  await migrate(db, {
    migrationsFolder: "drizzle"
  });
})();
