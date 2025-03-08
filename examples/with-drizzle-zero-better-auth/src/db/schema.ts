import { pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./auth-schema";

export const statusEnum = pgEnum("status", ["active", "done"]);

export const todos = pgTable("todos", {
  id: uuid().primaryKey(),
  userId: text()
    .notNull()
    .references(() => users.id),
  title: varchar({ length: 255 }).notNull(),
  status: statusEnum().notNull().default("active"),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull()
});
