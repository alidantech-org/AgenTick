import { boolean, index, integer, jsonb, pgSchema, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "./common";

export const catalogSchema = pgSchema("catalog");
export const catalogStatusEnum = catalogSchema.enum("catalog_status", [
  "active",
  "deprecated",
  "retired",
]);
export const modelStatusEnum = catalogSchema.enum("model_status", [
  "announced",
  "active",
  "preview",
  "deprecated",
  "retired",
]);

export const countries = catalogSchema.table("countries", {
  code: text("code").primaryKey(),
  alpha3: text("alpha3").notNull(),
  numericCode: text("numeric_code"),
  name: text("name").notNull(),
  regionCode: text("region_code"),
  subregionCode: text("subregion_code"),
  callingCode: text("calling_code"),
  currencyCode: text("currency_code"),
  status: catalogStatusEnum("status").notNull().default("active"),
  sourceVersion: text("source_version"),
  updatedAt,
});

export const timezones = catalogSchema.table(
  "timezones",
  {
    id: text("id").primaryKey(),
    countryCode: text("country_code").references(() => countries.code),
    canonicalId: text("canonical_id").notNull(),
    replacementId: text("replacement_id"),
    status: catalogStatusEnum("status").notNull().default("active"),
    tzdbVersion: text("tzdb_version").notNull(),
    updatedAt,
  },
  (table) => [index("timezones_country_idx").on(table.countryCode)],
);

export const languages = catalogSchema.table("languages", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  nativeName: text("native_name"),
  scriptCode: text("script_code"),
  direction: text("direction").notNull().default("ltr"),
  status: catalogStatusEnum("status").notNull().default("active"),
  sourceVersion: text("source_version"),
  updatedAt,
});

export const licenses = catalogSchema.table("licenses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  osiApproved: boolean("osi_approved").notNull().default(false),
  deprecated: boolean("deprecated").notNull().default(false),
  referenceUrl: text("reference_url"),
  sourceVersion: text("source_version"),
  updatedAt,
});

export const categories = catalogSchema.table(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id"),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    icon: text("icon"),
    sortOrder: integer("sort_order").notNull().default(0),
    status: catalogStatusEnum("status").notNull().default("active"),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("categories_slug_unique").on(table.slug)],
);

export const tags = catalogSchema.table(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    status: catalogStatusEnum("status").notNull().default("active"),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("tags_slug_unique").on(table.slug)],
);

export const capabilities = catalogSchema.table(
  "capabilities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    status: catalogStatusEnum("status").notNull().default("active"),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("capabilities_slug_unique").on(table.slug)],
);

export const aiProviders = catalogSchema.table(
  "ai_providers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    websiteUrl: text("website_url"),
    logoUrl: text("logo_url"),
    status: catalogStatusEnum("status").notNull().default("active"),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("ai_providers_slug_unique").on(table.slug)],
);

export const aiModelFamilies = catalogSchema.table(
  "ai_model_families",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => aiProviders.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("ai_model_families_provider_slug_unique").on(
      table.providerId,
      table.slug,
    ),
  ],
);

export const aiModels = catalogSchema.table(
  "ai_models",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => aiProviders.id, { onDelete: "cascade" }),
    familyId: uuid("family_id").references(() => aiModelFamilies.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    providerModelId: text("provider_model_id"),
    releaseDate: timestamp("release_date", { withTimezone: true }),
    knowledgeCutoff: timestamp("knowledge_cutoff", { withTimezone: true }),
    contextWindow: integer("context_window"),
    supportsTools: boolean("supports_tools").notNull().default(false),
    supportsVision: boolean("supports_vision").notNull().default(false),
    supportsReasoning: boolean("supports_reasoning").notNull().default(false),
    supportsStructuredOutput: boolean("supports_structured_output")
      .notNull()
      .default(false),
    status: modelStatusEnum("status").notNull().default("active"),
    deprecatedAt: timestamp("deprecated_at", { withTimezone: true }),
    replacedById: uuid("replaced_by_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("ai_models_provider_slug_unique").on(table.providerId, table.slug),
    index("ai_models_status_idx").on(table.status),
  ],
);

export const agentClients = catalogSchema.table(
  "agent_clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerId: uuid("provider_id").references(() => aiProviders.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    websiteUrl: text("website_url"),
    supportsSkillMd: boolean("supports_skill_md").notNull().default(false),
    supportsTools: boolean("supports_tools").notNull().default(false),
    supportsMcp: boolean("supports_mcp").notNull().default(false),
    status: catalogStatusEnum("status").notNull().default("active"),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("agent_clients_slug_unique").on(table.slug)],
);

function technologyTable(name: string) {
  return catalogSchema.table(
    name,
    {
      id: uuid("id").defaultRandom().primaryKey(),
      slug: text("slug").notNull(),
      name: text("name").notNull(),
      websiteUrl: text("website_url"),
      status: catalogStatusEnum("status").notNull().default("active"),
      createdAt,
      updatedAt,
    },
    (table) => [uniqueIndex(`${name}_slug_unique`).on(table.slug)],
  );
}

export const programmingLanguages = technologyTable("programming_languages");
export const frameworks = technologyTable("frameworks");
export const runtimes = technologyTable("runtimes");
export const packageManagers = technologyTable("package_managers");

export const seedRuns = catalogSchema.table("seed_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  source: text("source").notNull(),
  sourceVersion: text("source_version").notNull(),
  checksum: text("checksum"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Country = typeof countries.$inferSelect;
export type NewCountry = typeof countries.$inferInsert;
export type Timezone = typeof timezones.$inferSelect;
export type NewTimezone = typeof timezones.$inferInsert;
export type Language = typeof languages.$inferSelect;
export type NewLanguage = typeof languages.$inferInsert;
export type License = typeof licenses.$inferSelect;
export type NewLicense = typeof licenses.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type CatalogTag = typeof tags.$inferSelect;
export type NewCatalogTag = typeof tags.$inferInsert;
export type Capability = typeof capabilities.$inferSelect;
export type NewCapability = typeof capabilities.$inferInsert;
export type AiProvider = typeof aiProviders.$inferSelect;
export type NewAiProvider = typeof aiProviders.$inferInsert;
export type AiModelFamily = typeof aiModelFamilies.$inferSelect;
export type NewAiModelFamily = typeof aiModelFamilies.$inferInsert;
export type AiModel = typeof aiModels.$inferSelect;
export type NewAiModel = typeof aiModels.$inferInsert;
export type AgentClient = typeof agentClients.$inferSelect;
export type NewAgentClient = typeof agentClients.$inferInsert;
export type ProgrammingLanguage = typeof programmingLanguages.$inferSelect;
export type NewProgrammingLanguage = typeof programmingLanguages.$inferInsert;
export type Framework = typeof frameworks.$inferSelect;
export type NewFramework = typeof frameworks.$inferInsert;
export type Runtime = typeof runtimes.$inferSelect;
export type NewRuntime = typeof runtimes.$inferInsert;
export type PackageManager = typeof packageManagers.$inferSelect;
export type NewPackageManager = typeof packageManagers.$inferInsert;
export type CatalogSeedRun = typeof seedRuns.$inferSelect;
export type NewCatalogSeedRun = typeof seedRuns.$inferInsert;
