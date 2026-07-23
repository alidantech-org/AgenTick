import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const namespaceTypeEnum = pgEnum("namespace_type", [
  "user",
  "organization",
]);
export const organizationRoleEnum = pgEnum("organization_role", [
  "owner",
  "admin",
  "publisher",
  "member",
]);
export const inviteRoleEnum = pgEnum("invite_role", [
  "admin",
  "publisher",
  "member",
]);
export const skillVisibilityEnum = pgEnum("skill_visibility", [
  "public",
  "private",
]);
export const skillEventTypeEnum = pgEnum("skill_event_type", [
  "view",
  "download",
  "publish",
]);
export const outboxStatusEnum = pgEnum("outbox_status", [
  "pending",
  "processing",
  "sent",
  "failed",
]);

const createdAt = timestamp("created_at", { withTimezone: true })
  .notNull()
  .defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true })
  .notNull()
  .defaultNow();

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    handle: text("handle").notNull(),
    displayName: text("display_name"),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("accounts_email_unique").on(table.email),
    uniqueIndex("accounts_handle_unique").on(table.handle),
  ],
);

export const sessions = pgTable(
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
    createdAt,
    userAgent: text("user_agent"),
    ipHash: text("ip_hash"),
  },
  (table) => [uniqueIndex("sessions_token_hash_unique").on(table.tokenHash)],
);

export const loginOtps = pgTable(
  "login_otps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    purpose: text("purpose").notNull().default("sign-in"),
    otpHash: text("otp_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    requestFingerprint: text("request_fingerprint").notNull(),
    createdAt,
  },
  (table) => [
    index("login_otps_email_created_idx").on(table.email, table.createdAt),
    index("login_otps_fingerprint_created_idx").on(
      table.requestFingerprint,
      table.createdAt,
    ),
  ],
);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    ownerAccountId: uuid("owner_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("organizations_slug_unique").on(table.slug)],
);

export const registryNamespaces = pgTable(
  "registry_namespaces",
  {
    slug: text("slug").primaryKey(),
    namespaceType: namespaceTypeEnum("namespace_type").notNull(),
    ownerAccountId: uuid("owner_account_id").references(() => accounts.id, {
      onDelete: "cascade",
    }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    createdAt,
  },
  (table) => [
    uniqueIndex("registry_namespaces_organization_unique").on(
      table.organizationId,
    ),
    index("registry_namespaces_owner_idx").on(table.ownerAccountId),
  ],
);

export const organizationMembers = pgTable(
  "organization_members",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    role: organizationRoleEnum("role").notNull(),
    createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.accountId] }),
    index("organization_members_account_idx").on(table.accountId),
  ],
);

export const organizationInvites = pgTable(
  "organization_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    role: inviteRoleEnum("role").notNull(),
    createdByAccountId: uuid("created_by_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt,
  },
  (table) => [
    uniqueIndex("organization_invites_code_hash_unique").on(table.codeHash),
    index("organization_invites_email_expiry_idx").on(
      table.email,
      table.expiresAt,
    ),
  ],
);

export const apiTokens = pgTable(
  "api_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    tokenPrefix: text("token_prefix").notNull(),
    tokenHash: text("token_hash").notNull(),
    name: text("name").notNull(),
    scopes: jsonb("scopes").$type<string[]>().notNull().default([]),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt,
  },
  (table) => [
    uniqueIndex("api_tokens_token_hash_unique").on(table.tokenHash),
    index("api_tokens_account_idx").on(table.accountId),
  ],
);

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    namespaceSlug: text("namespace_slug")
      .notNull()
      .references(() => registryNamespaces.slug, { onDelete: "restrict" }),
    namespaceType: namespaceTypeEnum("namespace_type").notNull(),
    ownerAccountId: uuid("owner_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    visibility: skillVisibilityEnum("visibility").notNull(),
    license: text("license"),
    keywords: jsonb("keywords").$type<string[]>().notNull().default([]),
    latestVersion: text("latest_version"),
    viewsCount: bigint("views_count", { mode: "number" }).notNull().default(0),
    downloadsCount: bigint("downloads_count", { mode: "number" })
      .notNull()
      .default(0),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("skills_namespace_name_unique").on(
      table.namespaceSlug,
      table.name,
    ),
    index("skills_public_sort_idx").on(
      table.visibility,
      table.downloadsCount,
      table.viewsCount,
      table.updatedAt,
    ),
    index("skills_owner_idx").on(table.ownerAccountId, table.updatedAt),
    index("skills_organization_idx").on(table.organizationId, table.updatedAt),
  ],
);

export const skillVersions = pgTable(
  "skill_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    version: text("version").notNull(),
    integrity: text("integrity").notNull(),
    bundle: jsonb("bundle").$type<Record<string, unknown>>().notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull(),
    publishedByAccountId: uuid("published_by_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    yankedAt: timestamp("yanked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("skill_versions_skill_version_unique").on(
      table.skillId,
      table.version,
    ),
    index("skill_versions_skill_published_idx").on(
      table.skillId,
      table.publishedAt,
    ),
  ],
);

export const skillEvents = pgTable(
  "skill_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    versionId: uuid("version_id").references(() => skillVersions.id, {
      onDelete: "set null",
    }),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    eventType: skillEventTypeEnum("event_type").notNull(),
    dedupeKey: text("dedupe_key"),
    eventDay: date("event_day", { mode: "string" }).notNull(),
    createdAt,
  },
  (table) => [
    uniqueIndex("skill_events_dedupe_unique").on(
      table.skillId,
      table.eventType,
      table.dedupeKey,
      table.eventDay,
    ),
    index("skill_events_skill_created_idx").on(table.skillId, table.createdAt),
  ],
);

export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventType: text("event_type").notNull(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: text("aggregate_id").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: outboxStatusEnum("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    availableAt: timestamp("available_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt,
  },
  (table) => [
    index("outbox_events_dispatch_idx").on(
      table.status,
      table.availableAt,
      table.createdAt,
    ),
  ],
);

export type DatabaseTransaction = Parameters<
  Parameters<ReturnType<typeof import("./client").database>["transaction"]>[0]
>[0];
