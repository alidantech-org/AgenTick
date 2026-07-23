import {
  bigint,
  index,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "./common";
import { accounts } from "./users";
import { organizations, teams } from "./orgs";
import {
  agentClients,
  aiModels,
  capabilities,
  categories,
  frameworks,
  packageManagers,
  programmingLanguages,
  runtimes,
  tags as catalogTags,
} from "./catalog";
import { objects as storageObjects } from "./storage";

export const registrySchema = pgSchema("registry");
export const namespaceTypeEnum = registrySchema.enum("namespace_type", [
  "user",
  "organization",
]);
export const packageVisibilityEnum = registrySchema.enum("package_visibility", [
  "public",
  "private",
]);
export const packageStatusEnum = registrySchema.enum("package_status", [
  "active",
  "deprecated",
  "quarantined",
  "deleted",
]);
export const sourceExtensionEnum = registrySchema.enum("source_extension", [
  "sl",
  "skillib",
]);
export const compatibilityEnum = registrySchema.enum("compatibility", [
  "tested",
  "recommended",
  "compatible",
  "incompatible",
  "requires",
]);
export const accessSubjectEnum = registrySchema.enum("access_subject", [
  "account",
  "team",
]);
export const accessPermissionEnum = registrySchema.enum("access_permission", [
  "read",
  "publish",
  "manage",
]);
export const tagSourceEnum = registrySchema.enum("tag_source", [
  "publisher",
  "inferred",
  "moderator",
]);

export const namespaces = registrySchema.table(
  "namespaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    namespaceType: namespaceTypeEnum("namespace_type").notNull(),
    ownerAccountId: uuid("owner_account_id").references(() => accounts.id, {
      onDelete: "cascade",
    }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    status: packageStatusEnum("status").notNull().default("active"),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("namespaces_slug_unique").on(table.slug),
    uniqueIndex("namespaces_organization_unique").on(table.organizationId),
    index("namespaces_owner_idx").on(table.ownerAccountId),
  ],
);

export const packages = registrySchema.table(
  "packages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    namespaceId: uuid("namespace_id")
      .notNull()
      .references(() => namespaces.id, { onDelete: "restrict" }),
    namespaceSlug: text("namespace_slug").notNull(),
    namespaceType: namespaceTypeEnum("namespace_type").notNull(),
    ownerAccountId: uuid("owner_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    description: text("description").notNull(),
    visibility: packageVisibilityEnum("visibility").notNull(),
    status: packageStatusEnum("status").notNull().default("active"),
    license: text("license"),
    repositoryUrl: text("repository_url"),
    homepageUrl: text("homepage_url"),
    keywords: jsonb("keywords").$type<string[]>().notNull().default([]),
    latestVersion: text("latest_version"),
    viewsCount: bigint("views_count", { mode: "number" }).notNull().default(0),
    downloadsCount: bigint("downloads_count", { mode: "number" })
      .notNull()
      .default(0),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("packages_namespace_name_unique").on(
      table.namespaceId,
      table.normalizedName,
    ),
    index("packages_public_sort_idx").on(
      table.visibility,
      table.status,
      table.downloadsCount,
      table.updatedAt,
    ),
    index("packages_owner_idx").on(table.ownerAccountId, table.updatedAt),
    index("packages_organization_idx").on(
      table.organizationId,
      table.updatedAt,
    ),
  ],
);

export const versions = registrySchema.table(
  "versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    skillId: uuid("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    releaseNumber: integer("release_number").notNull(),
    version: text("version").notNull(),
    major: integer("major").notNull().default(1),
    minor: integer("minor").notNull().default(0),
    patch: integer("patch").notNull().default(0),
    prerelease: text("prerelease"),
    integrity: text("integrity").notNull(),
    artifactId: uuid("artifact_id").references(() => storageObjects.id, {
      onDelete: "restrict",
    }),
    sourceExtension: sourceExtensionEnum("source_extension").notNull().default("skillib"),
    languageVersion: text("language_version").notNull().default("0.1"),
    compilerVersion: text("compiler_version").notNull().default("0.1.0"),
    sourceText: text("source_text").notNull().default(""),
    compiledIr: jsonb("compiled_ir").$type<Record<string, unknown>>().notNull().default({}),
    sourceHash: text("source_hash").notNull().default(""),
    irHash: text("ir_hash").notNull().default(""),
    dependencies: jsonb("dependencies").$type<string[]>().notNull().default([]),
    permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
    diagnostics: jsonb("diagnostics").$type<Array<Record<string, unknown>>>().notNull().default([]),
    bundle: jsonb("bundle").$type<Record<string, unknown>>().notNull(),
    manifest: jsonb("manifest")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull(),
    provenance: jsonb("provenance")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    publishedByAccountId: uuid("published_by_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    yankedAt: timestamp("yanked_at", { withTimezone: true }),
    yankedByAccountId: uuid("yanked_by_account_id").references(
      () => accounts.id,
      { onDelete: "set null" },
    ),
    yankReason: text("yank_reason"),
  },
  (table) => [
    uniqueIndex("versions_package_version_unique").on(
      table.skillId,
      table.version,
    ),
    uniqueIndex("versions_package_release_unique").on(
      table.skillId,
      table.releaseNumber,
    ),
    index("versions_package_published_idx").on(
      table.skillId,
      table.publishedAt,
    ),
    index("versions_source_hash_idx").on(table.sourceHash),
    index("versions_ir_hash_idx").on(table.irHash),
  ],
);

export const distributionTags = registrySchema.table(
  "tags",
  {
    packageId: uuid("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    versionId: uuid("version_id")
      .notNull()
      .references(() => versions.id, { onDelete: "restrict" }),
    updatedByAccountId: uuid("updated_by_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    updatedAt,
  },
  (table) => [primaryKey({ columns: [table.packageId, table.name] })],
);

export const packageCategories = registrySchema.table(
  "package_categories",
  {
    packageId: uuid("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    createdAt,
  },
  (table) => [primaryKey({ columns: [table.packageId, table.categoryId] })],
);

export const packageTags = registrySchema.table(
  "package_tags",
  {
    packageId: uuid("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => catalogTags.id, { onDelete: "restrict" }),
    source: tagSourceEnum("source").notNull().default("publisher"),
    confidence: integer("confidence"),
    createdAt,
  },
  (table) => [primaryKey({ columns: [table.packageId, table.tagId] })],
);

export const packageModels = registrySchema.table(
  "package_models",
  {
    packageId: uuid("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    modelId: uuid("model_id")
      .notNull()
      .references(() => aiModels.id, { onDelete: "restrict" }),
    compatibility: compatibilityEnum("compatibility").notNull(),
    notes: text("notes"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedByAccountId: uuid("verified_by_account_id").references(
      () => accounts.id,
      { onDelete: "set null" },
    ),
    createdAt,
  },
  (table) => [primaryKey({ columns: [table.packageId, table.modelId] })],
);

export const packageClients = registrySchema.table(
  "package_clients",
  {
    packageId: uuid("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => agentClients.id, { onDelete: "restrict" }),
    compatibility: compatibilityEnum("compatibility").notNull(),
    notes: text("notes"),
    createdAt,
  },
  (table) => [primaryKey({ columns: [table.packageId, table.clientId] })],
);

export const packageCapabilities = registrySchema.table(
  "package_capabilities",
  {
    packageId: uuid("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    capabilityId: uuid("capability_id")
      .notNull()
      .references(() => capabilities.id, { onDelete: "restrict" }),
    required: integer("required").notNull().default(0),
    createdAt,
  },
  (table) => [primaryKey({ columns: [table.packageId, table.capabilityId] })],
);

function compatibilityTable(
  name: string,
  reference: { id: typeof programmingLanguages.id },
) {
  return registrySchema.table(
    name,
    {
      packageId: uuid("package_id")
        .notNull()
        .references(() => packages.id, { onDelete: "cascade" }),
      referenceId: uuid("reference_id")
        .notNull()
        .references(() => reference.id, { onDelete: "restrict" }),
      minimumVersion: text("minimum_version"),
      maximumVersion: text("maximum_version"),
      compatibility: compatibilityEnum("compatibility")
        .notNull()
        .default("compatible"),
      createdAt,
    },
    (table) => [primaryKey({ columns: [table.packageId, table.referenceId] })],
  );
}

export const packageProgrammingLanguages = compatibilityTable(
  "package_programming_languages",
  programmingLanguages,
);
export const packageFrameworks = compatibilityTable(
  "package_frameworks",
  frameworks,
);
export const packageRuntimes = compatibilityTable("package_runtimes", runtimes);
export const packageManagersCompatibility = compatibilityTable(
  "package_managers",
  packageManagers,
);

export const access = registrySchema.table(
  "access",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    packageId: uuid("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    subjectType: accessSubjectEnum("subject_type").notNull(),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "cascade",
    }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    permission: accessPermissionEnum("permission").notNull(),
    createdByAccountId: uuid("created_by_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    createdAt,
  },
  (table) => [
    uniqueIndex("access_account_unique").on(
      table.packageId,
      table.accountId,
      table.permission,
    ),
    uniqueIndex("access_team_unique").on(
      table.packageId,
      table.teamId,
      table.permission,
    ),
  ],
);

export type RegistryNamespace = typeof namespaces.$inferSelect;
export type NewRegistryNamespace = typeof namespaces.$inferInsert;
export type RegistryPackage = typeof packages.$inferSelect;
export type NewRegistryPackage = typeof packages.$inferInsert;
export type RegistryVersion = typeof versions.$inferSelect;
export type NewRegistryVersion = typeof versions.$inferInsert;
export type DistributionTag = typeof distributionTags.$inferSelect;
export type NewDistributionTag = typeof distributionTags.$inferInsert;
export type PackageCategory = typeof packageCategories.$inferSelect;
export type NewPackageCategory = typeof packageCategories.$inferInsert;
export type PackageTag = typeof packageTags.$inferSelect;
export type NewPackageTag = typeof packageTags.$inferInsert;
export type PackageModel = typeof packageModels.$inferSelect;
export type NewPackageModel = typeof packageModels.$inferInsert;
export type PackageClient = typeof packageClients.$inferSelect;
export type NewPackageClient = typeof packageClients.$inferInsert;
export type PackageCapability = typeof packageCapabilities.$inferSelect;
export type NewPackageCapability = typeof packageCapabilities.$inferInsert;
export type PackageAccess = typeof access.$inferSelect;
export type NewPackageAccess = typeof access.$inferInsert;
