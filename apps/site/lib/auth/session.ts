import "server-only";
import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { execute, stringValue } from "@/lib/db/client";
import { fingerprint, hashSessionToken, randomToken } from "./crypto";
import { SESSION_COOKIE } from "./constants";
const SESSION_DAYS = 30;

export interface SessionAccount {
  id: string;
  email: string;
  handle: string;
  displayName: string | null;
}

export async function createSession(accountId: string): Promise<void> {
  const token = randomToken(36);
  const tokenHash = hashSessionToken(token);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  );
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent");
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  await execute(
    `INSERT INTO sessions (id, account_id, token_hash, expires_at, last_seen_at, created_at, user_agent, ip_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      accountId,
      tokenHash,
      expiresAt.toISOString(),
      now.toISOString(),
      now.toISOString(),
      userAgent,
      ip ? fingerprint([ip]) : null,
    ],
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token)
    await execute("DELETE FROM sessions WHERE token_hash = ?", [
      hashSessionToken(token),
    ]);
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionAccount(): Promise<SessionAccount | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const now = new Date().toISOString();
  const result = await execute(
    `SELECT a.id, a.email, a.handle, a.display_name
       FROM sessions s
       JOIN accounts a ON a.id = s.account_id
      WHERE s.token_hash = ? AND s.expires_at > ?
      LIMIT 1`,
    [hashSessionToken(token), now],
  );
  const row = result.rows[0];
  if (!row) return null;
  await execute("UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?", [
    now,
    hashSessionToken(token),
  ]);
  return {
    id: String(row.id),
    email: String(row.email),
    handle: String(row.handle),
    displayName: stringValue(row.display_name),
  };
}
