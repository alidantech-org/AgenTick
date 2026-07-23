import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  // eslint-disable-next-line no-var
  var __skillibPostgresClient: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __skillibDatabase: Database | undefined;
}

function databaseUrl(): string {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) {
    throw new Error("DATABASE_URL is required and must point to PostgreSQL");
  }
  if (!/^postgres(?:ql)?:\/\//i.test(value)) {
    throw new Error("DATABASE_URL must use the postgresql:// protocol");
  }
  return value;
}

function createClient() {
  return postgres(databaseUrl(), {
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: process.env.DATABASE_PREPARE_STATEMENTS !== "false",
    ssl:
      process.env.DATABASE_SSL === "false"
        ? false
        : process.env.NODE_ENV === "production"
          ? "require"
          : undefined,
  });
}

export function database(): Database {
  if (globalThis.__skillibDatabase) return globalThis.__skillibDatabase;

  const client = globalThis.__skillibPostgresClient ?? createClient();
  const db = drizzle(client, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__skillibPostgresClient = client;
    globalThis.__skillibDatabase = db;
  }

  return db;
}

export type SkillibDatabase = Database;
