import "server-only";

import { and, eq, gt, isNull, or } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { database } from "@/lib/db/client";
import { accounts, apiTokens } from "@/lib/db/schema";
import { hashApiToken } from "./crypto";
import { getSessionAccount, type SessionAccount } from "./session";

export interface TokenPrincipal extends SessionAccount {
  tokenId: string;
  scopes: string[];
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
  if (!token.startsWith("skl_")) return null;

  const now = new Date();
  const rows = await database()
    .select({
      tokenId: apiTokens.id,
      scopes: apiTokens.scopes,
      id: accounts.id,
      email: accounts.email,
      handle: accounts.handle,
      displayName: accounts.displayName,
    })
    .from(apiTokens)
    .innerJoin(accounts, eq(accounts.id, apiTokens.accountId))
    .where(
      and(
        eq(apiTokens.tokenHash, hashApiToken(token)),
        isNull(apiTokens.revokedAt),
        or(isNull(apiTokens.expiresAt), gt(apiTokens.expiresAt, now)),
      ),
    )
    .limit(1);

  const principal = rows[0];
  if (!principal) return null;

  await database()
    .update(apiTokens)
    .set({ lastUsedAt: now })
    .where(eq(apiTokens.id, principal.tokenId));

  return principal;
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
