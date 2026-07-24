import {
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt } from "./common";
import { accounts } from "./users";

export const authSchema = pgSchema("auth");
export const challengePurposeEnum = authSchema.enum("challenge_purpose", [
  "sign-in",
  "verify-email",
  "recovery",
]);
export const tokenStatusEnum = authSchema.enum("token_status", [
  "active",
  "revoked",
  "expired",
]);
export const grantResourceEnum = authSchema.enum("grant_resource", [
  "global",
  "namespace",
  "package",
  "organization",
]);

export const sessions = authSchema.table(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revocationReason: text("revocation_reason"),
    userAgent: text("user_agent"),
    ipHash: text("ip_hash"),
    createdAt,
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_account_expiry_idx").on(table.accountId, table.expiresAt),
  ],
);

export const challenges = authSchema.table(
  "challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    purpose: challengePurposeEnum("purpose").notNull().default("sign-in"),
    otpHash: text("otp_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    requestFingerprint: text("request_fingerprint").notNull(),
    createdAt,
  },
  (table) => [
    index("challenges_email_created_idx").on(table.email, table.createdAt),
    index("challenges_fingerprint_created_idx").on(
      table.requestFingerprint,
      table.createdAt,
    ),
  ],
);

export const tokens = authSchema.table(
  "tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    tokenPrefix: text("token_prefix").notNull(),
    tokenHash: text("token_hash").notNull(),
    name: text("name").notNull(),
    scopes: jsonb("scopes").$type<string[]>().notNull().default([]),
    status: tokenStatusEnum("status").notNull().default("active"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt,
  },
  (table) => [
    uniqueIndex("tokens_token_hash_unique").on(table.tokenHash),
    index("tokens_account_idx").on(table.accountId),
  ],
);

export const tokenGrants = authSchema.table(
  "token_grants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tokenId: uuid("token_id")
      .notNull()
      .references(() => tokens.id, { onDelete: "cascade" }),
    permission: text("permission").notNull(),
    resourceType: grantResourceEnum("resource_type").notNull(),
    resourceId: uuid("resource_id"),
    createdAt,
  },
  (table) => [
    uniqueIndex("token_grants_unique").on(
      table.tokenId,
      table.permission,
      table.resourceType,
      table.resourceId,
    ),
  ],
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type AuthChallenge = typeof challenges.$inferSelect;
export type NewAuthChallenge = typeof challenges.$inferInsert;
export type ApiToken = typeof tokens.$inferSelect;
export type NewApiToken = typeof tokens.$inferInsert;
export type TokenGrant = typeof tokenGrants.$inferSelect;
export type NewTokenGrant = typeof tokenGrants.$inferInsert;
