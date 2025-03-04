import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
  casing: "snake_case",
  dbCredentials: {
    ssl: false,
    user: "user",
    password: "password",
    host: "127.0.0.1",
    port: 5432,
    database: "zstart_solid"
  }
});
