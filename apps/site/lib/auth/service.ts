import "server-only";

import { randomInt } from "node:crypto";
import { and, count, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { database, type SkillibDatabase } from "@/lib/db/client";
import { accounts, loginOtps, registryNamespaces } from "@/lib/db/schema";
import { dispatchPendingEvents } from "@/lib/events/dispatcher";
import { publishEvent } from "@/lib/events/bus";
import { isEmail, normalizeEmail, normalizeSlug } from "@/lib/format";
import { fingerprint, hashOtp, safeEqual } from "./crypto";
import { createSession } from "./session";

function displayNameFromEmail(email: string): string {
  return email
    .split("@")[0]!
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .slice(0, 80);
}

type Transaction = Parameters<Parameters<SkillibDatabase["transaction"]>[0]>[0];

async function uniqueHandle(email: string, tx: Transaction): Promise<string> {
  const local =
    normalizeSlug(email.split("@")[0] ?? "developer") || "developer";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate =
      attempt === 0 ? local : `${local}-${randomInt(1000, 9999)}`;
    const existing = await tx
      .select({ slug: registryNamespaces.slug })
      .from(registryNamespaces)
      .where(eq(registryNamespaces.slug, candidate))
      .limit(1);
    if (!existing[0]) return candidate;
  }

  return `${local}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function requestLoginOtp(rawEmail: string): Promise<void> {
  const email = normalizeEmail(rawEmail);
  if (!isEmail(email)) throw new Error("Enter a valid email address");

  const since = new Date(Date.now() - 15 * 60 * 1000);
  const requestHeaders = await headers();
  const requestFingerprint = fingerprint([
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim(),
    requestHeaders.get("user-agent"),
  ]);

  const [emailRequests, requesterRequests] = await Promise.all([
    database()
      .select({ value: count() })
      .from(loginOtps)
      .where(and(eq(loginOtps.email, email), gt(loginOtps.createdAt, since))),
    database()
      .select({ value: count() })
      .from(loginOtps)
      .where(
        and(
          eq(loginOtps.requestFingerprint, requestFingerprint),
          gt(loginOtps.createdAt, since),
        ),
      ),
  ]);

  if ((emailRequests[0]?.value ?? 0) >= 5) {
    throw new Error("Too many sign-in requests. Try again in a few minutes.");
  }
  if ((requesterRequests[0]?.value ?? 0) >= 20) {
    throw new Error(
      "Too many sign-in requests from this device. Try again later.",
    );
  }

  const otp = String(randomInt(0, 100_000_000)).padStart(8, "0");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

  await database().transaction(async (tx) => {
    const [record] = await tx
      .insert(loginOtps)
      .values({
        email,
        otpHash: hashOtp(email, otp),
        expiresAt,
        requestFingerprint,
      })
      .returning({ id: loginOtps.id });

    if (!record) throw new Error("Unable to create sign-in code");

    await publishEvent(
      {
        type: "auth.login-otp.requested",
        aggregateType: "login-otp",
        aggregateId: record.id,
        payload: { email, otp, expiresAt: expiresAt.toISOString() },
      },
      tx,
    );
  });

  const delivery = await dispatchPendingEvents(10);
  if (delivery.failed > 0) {
    throw new Error("Unable to send the sign-in email. Please try again.");
  }
}

export async function verifyLoginOtp(
  rawEmail: string,
  rawOtp: string,
): Promise<void> {
  const email = normalizeEmail(rawEmail);
  const otp = rawOtp.replace(/\s+/g, "");
  if (!isEmail(email) || !/^\d{8}$/.test(otp)) {
    throw new Error("Invalid email or one-time code");
  }

  const accountId = await database().transaction(async (tx) => {
    const rows = await tx.execute<{
      id: string;
      otp_hash: string;
      attempts: number;
      expires_at: Date;
    }>(sql`
      SELECT id, otp_hash, attempts, expires_at
      FROM login_otps
      WHERE email = ${email}
        AND purpose = 'sign-in'
        AND consumed_at IS NULL
      ORDER BY created_at DESC
      FOR UPDATE
      LIMIT 1
    `);

    const row = rows[0];
    if (!row) throw new Error("Request a new sign-in code");
    if (row.attempts >= 5) {
      throw new Error("This code has been locked. Request a new one.");
    }
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      throw new Error("This code has expired");
    }

    const valid = safeEqual(row.otp_hash, hashOtp(email, otp));
    if (!valid) {
      await tx
        .update(loginOtps)
        .set({ attempts: sql`${loginOtps.attempts} + 1` })
        .where(eq(loginOtps.id, row.id));
      throw new Error("The one-time code is incorrect");
    }

    await tx
      .update(loginOtps)
      .set({ consumedAt: new Date() })
      .where(and(eq(loginOtps.id, row.id), isNull(loginOtps.consumedAt)));

    const existing = await tx
      .select({ id: accounts.id, handle: accounts.handle })
      .from(accounts)
      .where(eq(accounts.email, email))
      .limit(1);

    if (existing[0]) {
      await tx
        .insert(registryNamespaces)
        .values({
          slug: existing[0].handle,
          namespaceType: "user",
          ownerAccountId: existing[0].id,
        })
        .onConflictDoNothing();
      return existing[0].id;
    }

    const handle = await uniqueHandle(email, tx);
    const [created] = await tx
      .insert(accounts)
      .values({
        email,
        handle,
        displayName: displayNameFromEmail(email),
      })
      .returning({ id: accounts.id });

    if (!created) throw new Error("Unable to create account");

    await tx.insert(registryNamespaces).values({
      slug: handle,
      namespaceType: "user",
      ownerAccountId: created.id,
    });

    return created.id;
  });

  await createSession(accountId);
}
