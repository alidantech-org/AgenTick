import {
  bigint,
  customType,
  index,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt } from "./common";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const storageSchema = pgSchema("storage");
export const storageProviderEnum = storageSchema.enum("provider", [
  "database",
  "s3",
  "r2",
]);
export const uploadStatusEnum = storageSchema.enum("upload_status", [
  "pending",
  "completed",
  "aborted",
  "expired",
]);

export const objects = storageSchema.table(
  "objects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: storageProviderEnum("provider").notNull().default("database"),
    bucket: text("bucket"),
    objectKey: text("object_key"),
    contentType: text("content_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    sha256: text("sha256").notNull(),
    sha512: text("sha512").notNull(),
    compression: text("compression"),
    payload: bytea("payload"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt,
  },
  (table) => [
    uniqueIndex("objects_sha512_unique").on(table.sha512),
    uniqueIndex("objects_provider_key_unique").on(
      table.provider,
      table.bucket,
      table.objectKey,
    ),
    index("objects_deleted_idx").on(table.deletedAt),
  ],
);

export const uploads = storageSchema.table(
  "uploads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: storageProviderEnum("provider").notNull(),
    objectKey: text("object_key").notNull(),
    status: uploadStatusEnum("status").notNull().default("pending"),
    expectedSizeBytes: bigint("expected_size_bytes", { mode: "number" }),
    expectedSha512: text("expected_sha512"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    completedObjectId: uuid("completed_object_id").references(() => objects.id, {
      onDelete: "set null",
    }),
    createdAt,
  },
  (table) => [
    index("uploads_status_expiry_idx").on(table.status, table.expiresAt),
  ],
);

export type StorageObject = typeof objects.$inferSelect;
export type NewStorageObject = typeof objects.$inferInsert;
export type StorageUpload = typeof uploads.$inferSelect;
export type NewStorageUpload = typeof uploads.$inferInsert;
