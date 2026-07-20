import "server-only";
import {
  createClient,
  type Client,
  type InStatement,
  type InValue,
} from "@libsql/client";
import { SCHEMA_STATEMENTS, SCHEMA_VERSION } from "./schema";

let client: Client | undefined;
let schemaReady: Promise<void> | undefined;

export function createDatabaseClient(): Client {
  if (client) return client;
  const url = process.env.DATABASE_URL ?? "file:skillib.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  client = createClient({ url, ...(authToken ? { authToken } : {}) });
  return client;
}

export async function ensureDatabase(): Promise<Client> {
  const database = createDatabaseClient();
  schemaReady ??= (async () => {
    await database.execute("PRAGMA foreign_keys = ON");
    await database.execute(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      ) STRICT`,
    );
    const applied = await database.execute({
      sql: "SELECT 1 FROM schema_migrations WHERE version = ? LIMIT 1",
      args: [SCHEMA_VERSION],
    });
    if (!applied.rows[0]) {
      await database.batch(
        [
          ...SCHEMA_STATEMENTS.map((sql) => ({ sql })),
          {
            sql: "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
            args: [SCHEMA_VERSION, new Date().toISOString()],
          },
        ],
        "write",
      );
    }
  })();
  await schemaReady;
  return database;
}

export async function execute(sql: string, args: InValue[] = []) {
  const database = await ensureDatabase();
  return database.execute({ sql, args });
}

export async function executeBatch(
  statements: InStatement[],
  mode: "write" | "read" | "deferred" = "write",
) {
  const database = await ensureDatabase();
  return database.batch(statements, mode);
}

export function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function numberValue(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}
