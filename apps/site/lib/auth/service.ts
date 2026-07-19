import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { execute, executeBatch } from "@/lib/db/client";
import { isEmail, normalizeEmail, normalizeSlug } from "@/lib/format";
import { fingerprint, hashOtp, safeEqual } from "./crypto";
import { sendLoginOtp } from "./mail";
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

async function uniqueHandle(email: string): Promise<string> {
  const local =
    normalizeSlug(email.split("@")[0] ?? "developer") || "developer";
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate =
      attempt === 0 ? local : `${local}-${randomInt(1000, 9999)}`;
    const existing = await execute(
      "SELECT 1 FROM registry_namespaces WHERE slug = ? LIMIT 1",
      [candidate],
    );
    if (!existing.rows[0]) return candidate;
  }
  return `${local}-${randomUUID().slice(0, 8)}`;
}

export async function requestLoginOtp(
  rawEmail: string,
): Promise<{ debugOtp?: string }> {
  const email = normalizeEmail(rawEmail);
  if (!isEmail(email)) throw new Error("Enter a valid email address");

  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const requestHeaders = await headers();
  const requestFingerprint = fingerprint([
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim(),
    requestHeaders.get("user-agent"),
  ]);
  const recent = await execute(
    `SELECT
       SUM(CASE WHEN email = ? THEN 1 ELSE 0 END) AS email_count,
       SUM(CASE WHEN request_fingerprint = ? THEN 1 ELSE 0 END) AS requester_count
       FROM login_otps
      WHERE created_at > ?`,
    [email, requestFingerprint, since],
  );
  if (Number(recent.rows[0]?.email_count ?? 0) >= 5) {
    throw new Error("Too many sign-in requests. Try again in a few minutes.");
  }
  if (Number(recent.rows[0]?.requester_count ?? 0) >= 20) {
    throw new Error(
      "Too many sign-in requests from this device. Try again later.",
    );
  }

  const otp = String(randomInt(0, 100_000_000)).padStart(8, "0");
  const otpId = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
  await execute(
    `INSERT INTO login_otps (
       id, email, purpose, otp_hash, attempts, expires_at, request_fingerprint, created_at
     ) VALUES (?, ?, 'sign-in', ?, 0, ?, ?, ?)`,
    [
      otpId,
      email,
      hashOtp(email, otp),
      expiresAt.toISOString(),
      requestFingerprint,
      now.toISOString(),
    ],
  );
  try {
    await sendLoginOtp(email, otp);
  } catch (error) {
    await execute("DELETE FROM login_otps WHERE id = ?", [otpId]);
    throw error;
  }
  return process.env.NODE_ENV === "production" ? {} : { debugOtp: otp };
}

export async function verifyLoginOtp(
  rawEmail: string,
  rawOtp: string,
): Promise<void> {
  const email = normalizeEmail(rawEmail);
  const otp = rawOtp.replace(/\s+/g, "");
  if (!isEmail(email) || !/^\d{8}$/.test(otp))
    throw new Error("Invalid email or one-time code");

  const result = await execute(
    `SELECT id, otp_hash, attempts, expires_at
       FROM login_otps
      WHERE email = ? AND purpose = 'sign-in' AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1`,
    [email],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Request a new sign-in code");
  const otpId = String(row.id);
  const attempts = Number(row.attempts ?? 0);
  if (attempts >= 5)
    throw new Error("This code has been locked. Request a new one.");
  if (new Date(String(row.expires_at)).getTime() <= Date.now())
    throw new Error("This code has expired");

  const valid = safeEqual(String(row.otp_hash), hashOtp(email, otp));
  if (!valid) {
    await execute(
      "UPDATE login_otps SET attempts = attempts + 1 WHERE id = ?",
      [otpId],
    );
    throw new Error("The one-time code is incorrect");
  }

  const now = new Date().toISOString();
  await execute("UPDATE login_otps SET consumed_at = ? WHERE id = ?", [
    now,
    otpId,
  ]);
  const account = await execute(
    "SELECT id, handle FROM accounts WHERE email = ? LIMIT 1",
    [email],
  );
  let accountId = account.rows[0] ? String(account.rows[0].id) : null;
  if (!accountId) {
    accountId = randomUUID();
    const handle = await uniqueHandle(email);
    await executeBatch([
      {
        sql: `INSERT INTO accounts (id, email, handle, display_name, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [accountId, email, handle, displayNameFromEmail(email), now, now],
      },
      {
        sql: `INSERT INTO registry_namespaces (slug, namespace_type, owner_account_id, created_at)
              VALUES (?, 'user', ?, ?)`,
        args: [handle, accountId, now],
      },
    ]);
  } else {
    const handle = String(account.rows[0]?.handle);
    await execute(
      `INSERT OR IGNORE INTO registry_namespaces (slug, namespace_type, owner_account_id, created_at)
       VALUES (?, 'user', ?, ?)`,
      [handle, accountId, now],
    );
  }
  await createSession(accountId);
}
