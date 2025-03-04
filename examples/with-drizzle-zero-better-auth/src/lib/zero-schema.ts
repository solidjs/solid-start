import {
  ANYONE_CAN,
  type ExpressionBuilder,
  type PermissionsConfig,
  type Row,
  definePermissions
} from "@rocicorp/zero";
import { createZeroSchema } from "drizzle-zero";
import * as drizzleAuthSchema from "../db/auth-schema";
import * as drizzleSchema from "../db/schema";

export const schema = createZeroSchema(
  { ...drizzleAuthSchema, ...drizzleSchema },
  {
    version: 1,
    casing: "snake_case",
    tables: {
      verifications: false,
      accounts: false,
      sessions: false,
      jwkss: false,
      users: {
        id: true,
        email: true,
        emailVerified: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        displayUsername: true,
        image: true,
        name: true
      },
      todos: {
        id: true,
        userId: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    }
  }
);

type AuthData = {
  sub: string;
};

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  const allowIfTodoCreator = (authData: AuthData, { cmp }: ExpressionBuilder<Schema, "todos">) =>
    cmp("userId", "=", authData.sub);

  return {
    todos: {
      row: {
        select: [allowIfTodoCreator],
        insert: ANYONE_CAN,
        update: {
          postMutation: [allowIfTodoCreator],
          preMutation: [allowIfTodoCreator]
        },
        delete: [allowIfTodoCreator]
      }
    },
    users: {
      row: {
        select: ANYONE_CAN
        // Other operations are denied by default
        // Other tables are denied by default.
      }
    }
  } satisfies PermissionsConfig<AuthData, Schema>;
});

export type Schema = typeof schema;
type User = Row<typeof schema.tables.users>;
type Todo = Row<typeof schema.tables.todos>;
