import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

function secret(name: "AUTH_SECRET" | "AGENTICK_TOKEN_PEPPER"): string {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} is required in production`);
  }
  return `agentick-development-${name.toLowerCase()}`;
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHmac("sha256", secret("AUTH_SECRET"))
    .update(token)
    .digest("hex");
}

export function hashApiToken(token: string): string {
  return createHmac("sha256", secret("AGENTICK_TOKEN_PEPPER"))
    .update(token)
    .digest("hex");
}

export function hashOtp(email: string, otp: string): string {
  return createHmac("sha256", secret("AUTH_SECRET"))
    .update(`sign-in:${email}:${otp}`)
    .digest("hex");
}

export function hashInviteCode(code: string): string {
  return createHmac("sha256", secret("AUTH_SECRET"))
    .update(`organization-invite:${code}`)
    .digest("hex");
}

export function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function fingerprint(parts: Array<string | null | undefined>): string {
  return createHash("sha256")
    .update(parts.filter(Boolean).join("|"))
    .digest("hex");
}
