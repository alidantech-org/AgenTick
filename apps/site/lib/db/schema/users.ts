import { index, pgEnum, pgSchema, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "./common";

export const usersSchema = pgSchema("users");
export const accountStatusEnum = usersSchema.enum("account_status", [
  "active",
  "suspended",
  "deleted",
]);

export const accounts = usersSchema.table(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    handle: text("handle").notNull(),
    displayName: text("display_name"),
    status: accountStatusEnum("status").notNull().default("active"),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("accounts_email_unique").on(table.email),
    uniqueIndex("accounts_handle_unique").on(table.handle),
    index("accounts_status_idx").on(table.status),
  ],
);

export const emails = usersSchema.table(
  "emails",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    normalizedEmail: text("normalized_email").notNull(),
    isPrimary: text("is_primary").notNull().default("true"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt,
  },
  (table) => [
    uniqueIndex("emails_normalized_unique").on(table.normalizedEmail),
    index("emails_account_idx").on(table.accountId),
  ],
);

export const profiles = usersSchema.table("profiles", {
  accountId: uuid("account_id")
    .primaryKey()
    .references(() => accounts.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  websiteUrl: text("website_url"),
  countryCode: text("country_code"),
  timezone: text("timezone"),
  locale: text("locale"),
  updatedAt,
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type UserEmail = typeof emails.$inferSelect;
export type NewUserEmail = typeof emails.$inferInsert;
export type UserProfile = typeof profiles.$inferSelect;
export type NewUserProfile = typeof profiles.$inferInsert;
