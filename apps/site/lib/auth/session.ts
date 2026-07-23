import "server-only";

import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { database } from "@/lib/db/client";
import { accounts, sessions } from "@/lib/db/schema";
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

  await database()
    .insert(sessions)
    .values({
      accountId,
      tokenHash,
      expiresAt,
      lastSeenAt: now,
      userAgent,
      ipHash: ip ? fingerprint([ip]) : null,
    });

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
  if (token) {
    await database()
      .update(sessions)
      .set({
        revokedAt: new Date(),
        revocationReason: "logout",
      })
      .where(
        and(
          eq(sessions.tokenHash, hashSessionToken(token)),
          isNull(sessions.revokedAt),
        ),
      );
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionAccount(): Promise<SessionAccount | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const now = new Date();
  const rows = await database()
    .select({
      id: accounts.id,
      email: accounts.email,
      handle: accounts.handle,
      displayName: accounts.displayName,
    })
    .from(sessions)
    .innerJoin(accounts, eq(accounts.id, sessions.accountId))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, now),
        isNull(sessions.revokedAt),
      ),
    )
    .limit(1);

  const account = rows[0];
  if (!account) return null;

  await database()
    .update(sessions)
    .set({ lastSeenAt: now })
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.revokedAt),
      ),
    );

  return account;
}
