import "server-only";

import { and, desc, eq, isNull, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { database } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";
import { hashSessionToken } from "@/lib/auth/crypto";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export interface AccountSessionSummary {
  id: string;
  userAgent: string | null;
  ipFingerprint: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  current: boolean;
}

async function currentSessionHash(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? hashSessionToken(token) : null;
}

export async function listAccountSessions(
  accountId: string,
): Promise<AccountSessionSummary[]> {
  const currentHash = await currentSessionHash();
  const rows = await database()
    .select({
      id: sessions.id,
      tokenHash: sessions.tokenHash,
      userAgent: sessions.userAgent,
      ipHash: sessions.ipHash,
      createdAt: sessions.createdAt,
      lastSeenAt: sessions.lastSeenAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(
      and(eq(sessions.accountId, accountId), isNull(sessions.revokedAt)),
    )
    .orderBy(desc(sessions.lastSeenAt));

  return rows.map((row) => ({
    id: row.id,
    userAgent: row.userAgent,
    ipFingerprint: row.ipHash ? row.ipHash.slice(0, 12) : null,
    createdAt: row.createdAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    current: row.tokenHash === currentHash,
  }));
}

export async function revokeAccountSession(
  accountId: string,
  sessionId: string,
): Promise<boolean> {
  const currentHash = await currentSessionHash();
  const rows = await database()
    .update(sessions)
    .set({
      revokedAt: new Date(),
      revocationReason: "revoked-by-account-owner",
    })
    .where(
      and(
        eq(sessions.id, sessionId),
        eq(sessions.accountId, accountId),
        isNull(sessions.revokedAt),
        currentHash ? ne(sessions.tokenHash, currentHash) : undefined,
      ),
    )
    .returning({ id: sessions.id });
  return rows.length > 0;
}

export async function revokeOtherAccountSessions(
  accountId: string,
): Promise<number> {
  const currentHash = await currentSessionHash();
  if (!currentHash) return 0;

  const rows = await database()
    .update(sessions)
    .set({
      revokedAt: new Date(),
      revocationReason: "other-sessions-revoked-by-account-owner",
    })
    .where(
      and(
        eq(sessions.accountId, accountId),
        isNull(sessions.revokedAt),
        ne(sessions.tokenHash, currentHash),
      ),
    )
    .returning({ id: sessions.id });
  return rows.length;
}
