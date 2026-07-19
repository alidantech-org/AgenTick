import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { execute, stringValue } from "@/lib/db/client";
import { hashApiToken } from "./crypto";
import { getSessionAccount, type SessionAccount } from "./session";

export interface TokenPrincipal extends SessionAccount {
  tokenId: string;
  scopes: string[];
}

function parseScopes(value: unknown): string[] {
  try {
    const parsed = JSON.parse(String(value)) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export async function requireAccount(): Promise<SessionAccount> {
  const account = await getSessionAccount();
  if (!account) redirect("/login?next=/account");
  return account;
}

export async function optionalAccount(): Promise<SessionAccount | null> {
  return getSessionAccount();
}

export async function getBearerPrincipal(
  requestHeaders?: Headers,
): Promise<TokenPrincipal | null> {
  const source = requestHeaders ?? (await headers());
  const authorization = source.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  if (!token.startsWith("agt_")) return null;

  const now = new Date().toISOString();
  const result = await execute(
    `SELECT t.id AS token_id, t.scopes_json, a.id, a.email, a.handle, a.display_name
       FROM api_tokens t
       JOIN accounts a ON a.id = t.account_id
      WHERE t.token_hash = ?
        AND t.revoked_at IS NULL
        AND (t.expires_at IS NULL OR t.expires_at > ?)
      LIMIT 1`,
    [hashApiToken(token), now],
  );
  const row = result.rows[0];
  if (!row) return null;
  await execute("UPDATE api_tokens SET last_used_at = ? WHERE id = ?", [
    now,
    String(row.token_id),
  ]);
  return {
    tokenId: String(row.token_id),
    id: String(row.id),
    email: String(row.email),
    handle: String(row.handle),
    displayName: stringValue(row.display_name),
    scopes: parseScopes(row.scopes_json),
  };
}

export async function getRequestPrincipal(
  requestHeaders: Headers,
): Promise<TokenPrincipal | SessionAccount | null> {
  return (await getBearerPrincipal(requestHeaders)) ?? getSessionAccount();
}

export function hasScope(
  principal: TokenPrincipal | SessionAccount,
  scope: string,
): boolean {
  return "scopes" in principal
    ? principal.scopes.includes(scope) || principal.scopes.includes("*")
    : true;
}
