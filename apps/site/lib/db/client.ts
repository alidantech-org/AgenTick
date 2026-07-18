import 'server-only';
import { createClient } from '@libsql/client';

export function createDatabaseClient() {
  const url = process.env.DATABASE_URL ?? 'file:./data/agentick.db';
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  return createClient({ url, ...(authToken ? { authToken } : {}) });
}
