CREATE SCHEMA IF NOT EXISTS "users";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "auth";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "orgs";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "registry";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "catalog";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "storage";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "analytics";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "events";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "platform";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "audit";
--> statement-breakpoint

ALTER TYPE "namespace_type" SET SCHEMA "registry";
--> statement-breakpoint
ALTER TYPE "organization_role" SET SCHEMA "orgs";
--> statement-breakpoint
ALTER TYPE "orgs"."organization_role" RENAME TO "membership_role";
--> statement-breakpoint
ALTER TYPE "skill_visibility" SET SCHEMA "registry";
--> statement-breakpoint
ALTER TYPE "registry"."skill_visibility" RENAME TO "package_visibility";
--> statement-breakpoint
ALTER TYPE "skill_event_type" SET SCHEMA "analytics";
--> statement-breakpoint
ALTER TYPE "analytics"."skill_event_type" RENAME TO "event_type";
--> statement-breakpoint
ALTER TYPE "outbox_status" SET SCHEMA "events";
--> statement-breakpoint

ALTER TABLE "accounts" SET SCHEMA "users";
--> statement-breakpoint
ALTER TABLE "sessions" SET SCHEMA "auth";
--> statement-breakpoint
ALTER TABLE "login_otps" SET SCHEMA "auth";
--> statement-breakpoint
ALTER TABLE "auth"."login_otps" RENAME TO "challenges";
--> statement-breakpoint
ALTER TABLE "api_tokens" SET SCHEMA "auth";
--> statement-breakpoint
ALTER TABLE "auth"."api_tokens" RENAME TO "tokens";
--> statement-breakpoint
ALTER TABLE "organizations" SET SCHEMA "orgs";
--> statement-breakpoint
ALTER TABLE "organization_members" SET SCHEMA "orgs";
--> statement-breakpoint
ALTER TABLE "orgs"."organization_members" RENAME TO "memberships";
--> statement-breakpoint
ALTER TABLE "organization_invites" SET SCHEMA "orgs";
--> statement-breakpoint
ALTER TABLE "orgs"."organization_invites" RENAME TO "invitations";
--> statement-breakpoint
ALTER TABLE "registry_namespaces" SET SCHEMA "registry";
--> statement-breakpoint
ALTER TABLE "registry"."registry_namespaces" RENAME TO "namespaces";
--> statement-breakpoint
ALTER TABLE "skills" SET SCHEMA "registry";
--> statement-breakpoint
ALTER TABLE "registry"."skills" RENAME TO "packages";
--> statement-breakpoint
ALTER TABLE "skill_versions" SET SCHEMA "registry";
--> statement-breakpoint
ALTER TABLE "registry"."skill_versions" RENAME TO "versions";
--> statement-breakpoint
ALTER TABLE "skill_events" SET SCHEMA "analytics";
--> statement-breakpoint
ALTER TABLE "analytics"."skill_events" RENAME TO "events";
--> statement-breakpoint
ALTER TABLE "outbox_events" SET SCHEMA "events";
--> statement-breakpoint
ALTER TABLE "events"."outbox_events" RENAME TO "outbox";
--> statement-breakpoint

CREATE TYPE "users"."account_status" AS ENUM ('active', 'suspended', 'deleted');
--> statement-breakpoint
CREATE TYPE "auth"."challenge_purpose" AS ENUM ('sign-in', 'verify-email', 'recovery');
--> statement-breakpoint
CREATE TYPE "auth"."token_status" AS ENUM ('active', 'revoked', 'expired');
--> statement-breakpoint
CREATE TYPE "auth"."grant_resource" AS ENUM ('global', 'namespace', 'package', 'organization');
--> statement-breakpoint
CREATE TYPE "orgs"."organization_status" AS ENUM ('active', 'suspended', 'deleted');
--> statement-breakpoint
CREATE TYPE "orgs"."membership_status" AS ENUM ('invited', 'active', 'suspended');
--> statement-breakpoint
CREATE TYPE "orgs"."invitation_status" AS ENUM ('pending', 'accepted', 'revoked', 'expired');
--> statement-breakpoint
CREATE TYPE "registry"."package_status" AS ENUM ('active', 'deprecated', 'quarantined', 'deleted');
--> statement-breakpoint
CREATE TYPE "registry"."compatibility" AS ENUM ('tested', 'recommended', 'compatible', 'incompatible', 'requires');
--> statement-breakpoint
CREATE TYPE "registry"."access_subject" AS ENUM ('account', 'team');
--> statement-breakpoint
CREATE TYPE "registry"."access_permission" AS ENUM ('read', 'publish', 'manage');
--> statement-breakpoint
CREATE TYPE "registry"."tag_source" AS ENUM ('publisher', 'inferred', 'moderator');
--> statement-breakpoint
CREATE TYPE "catalog"."catalog_status" AS ENUM ('active', 'deprecated', 'retired');
--> statement-breakpoint
CREATE TYPE "catalog"."model_status" AS ENUM ('announced', 'active', 'preview', 'deprecated', 'retired');
--> statement-breakpoint
CREATE TYPE "storage"."provider" AS ENUM ('database', 's3', 'r2');
--> statement-breakpoint
CREATE TYPE "storage"."upload_status" AS ENUM ('pending', 'completed', 'aborted', 'expired');
--> statement-breakpoint
CREATE TYPE "events"."delivery_status" AS ENUM ('pending', 'processing', 'delivered', 'failed');
--> statement-breakpoint

ALTER TABLE "users"."accounts"
  ADD COLUMN "status" "users"."account_status" DEFAULT 'active' NOT NULL,
  ADD COLUMN "suspended_at" timestamp with time zone,
  ADD COLUMN "deleted_at" timestamp with time zone;
--> statement-breakpoint

ALTER TABLE "auth"."sessions"
  ADD COLUMN "revoked_at" timestamp with time zone,
  ADD COLUMN "revocation_reason" text;
--> statement-breakpoint

ALTER TABLE "auth"."challenges" DROP CONSTRAINT IF EXISTS "login_otps_purpose_check";
--> statement-breakpoint
ALTER TABLE "auth"."challenges"
  ALTER COLUMN "purpose" DROP DEFAULT,
  ALTER COLUMN "purpose" TYPE "auth"."challenge_purpose" USING "purpose"::text::"auth"."challenge_purpose",
  ALTER COLUMN "purpose" SET DEFAULT 'sign-in',
  ADD COLUMN "max_attempts" integer DEFAULT 5 NOT NULL;
--> statement-breakpoint

ALTER TABLE "auth"."tokens"
  ADD COLUMN "status" "auth"."token_status" DEFAULT 'active' NOT NULL;
--> statement-breakpoint
UPDATE "auth"."tokens" SET "status" = 'revoked' WHERE "revoked_at" IS NOT NULL;
--> statement-breakpoint

ALTER TABLE "orgs"."organizations"
  ADD COLUMN "status" "orgs"."organization_status" DEFAULT 'active' NOT NULL,
  ADD COLUMN "deleted_at" timestamp with time zone;
--> statement-breakpoint

ALTER TABLE "orgs"."memberships"
  ADD COLUMN "status" "orgs"."membership_status" DEFAULT 'active' NOT NULL,
  ADD COLUMN "joined_at" timestamp with time zone DEFAULT now();
--> statement-breakpoint

ALTER TABLE "orgs"."invitations"
  ALTER COLUMN "role" TYPE "orgs"."membership_role" USING "role"::text::"orgs"."membership_role",
  ADD COLUMN "status" "orgs"."invitation_status" DEFAULT 'pending' NOT NULL,
  ADD COLUMN "accepted_by_account_id" uuid,
  ADD COLUMN "revoked_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "orgs"."invitations" SET "status" = 'accepted' WHERE "accepted_at" IS NOT NULL;
--> statement-breakpoint
DROP TYPE "invite_role";
--> statement-breakpoint

ALTER TABLE "registry"."namespaces" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "registry"."namespaces" ADD COLUMN "status" "registry"."package_status" DEFAULT 'active' NOT NULL;
--> statement-breakpoint
ALTER TABLE "registry"."namespaces" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "registry"."namespaces" DROP CONSTRAINT "registry_namespaces_pkey";
--> statement-breakpoint
ALTER TABLE "registry"."namespaces" ADD CONSTRAINT "namespaces_pkey" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "registry"."namespaces" ADD CONSTRAINT "namespaces_slug_unique" UNIQUE ("slug");
--> statement-breakpoint

ALTER TABLE "registry"."packages"
  ADD COLUMN "namespace_id" uuid,
  ADD COLUMN "normalized_name" text,
  ADD COLUMN "status" "registry"."package_status" DEFAULT 'active' NOT NULL,
  ADD COLUMN "repository_url" text,
  ADD COLUMN "homepage_url" text,
  ADD COLUMN "deleted_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "registry"."packages" p
SET "namespace_id" = n."id", "normalized_name" = lower(p."name")
FROM "registry"."namespaces" n
WHERE n."slug" = p."namespace_slug";
--> statement-breakpoint
ALTER TABLE "registry"."packages" ALTER COLUMN "namespace_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "registry"."packages" ALTER COLUMN "normalized_name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "registry"."packages" ADD CONSTRAINT "packages_namespace_id_namespaces_id_fk" FOREIGN KEY ("namespace_id") REFERENCES "registry"."namespaces"("id") ON DELETE restrict;
--> statement-breakpoint
ALTER TABLE "registry"."packages" DROP CONSTRAINT IF EXISTS "skills_namespace_name_unique";
--> statement-breakpoint
ALTER TABLE "registry"."packages" ADD CONSTRAINT "packages_namespace_name_unique" UNIQUE ("namespace_id", "normalized_name");
--> statement-breakpoint

ALTER TABLE "registry"."versions" RENAME COLUMN "skill_id" TO "package_id";
--> statement-breakpoint
ALTER TABLE "registry"."versions"
  ADD COLUMN "release_number" integer,
  ADD COLUMN "major" integer DEFAULT 1 NOT NULL,
  ADD COLUMN "minor" integer DEFAULT 0 NOT NULL,
  ADD COLUMN "patch" integer DEFAULT 0 NOT NULL,
  ADD COLUMN "prerelease" text,
  ADD COLUMN "artifact_id" uuid,
  ADD COLUMN "manifest" jsonb DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN "provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN "yanked_by_account_id" uuid,
  ADD COLUMN "yank_reason" text;
--> statement-breakpoint
WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY package_id ORDER BY published_at, id)::integer AS release_number
  FROM "registry"."versions"
)
UPDATE "registry"."versions" v
SET release_number = ranked.release_number
FROM ranked WHERE ranked.id = v.id;
--> statement-breakpoint
UPDATE "registry"."versions"
SET
  major = COALESCE(NULLIF(split_part(regexp_replace(version, '^v', ''), '.', 1), '')::integer, 1),
  minor = COALESCE(NULLIF(regexp_replace(split_part(version, '.', 2), '[^0-9].*$', ''), '')::integer, 0),
  patch = COALESCE(NULLIF(regexp_replace(split_part(version, '.', 3), '[^0-9].*$', ''), '')::integer, 0),
  prerelease = NULLIF(substring(version from '-(.+)$'), '');
--> statement-breakpoint
ALTER TABLE "registry"."versions" ALTER COLUMN "release_number" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "registry"."versions" ADD CONSTRAINT "versions_package_release_unique" UNIQUE ("package_id", "release_number");
--> statement-breakpoint

ALTER TABLE "analytics"."events" RENAME COLUMN "skill_id" TO "package_id";
--> statement-breakpoint
ALTER TABLE "analytics"."events"
  ADD COLUMN "token_id" uuid,
  ADD COLUMN "occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
  ADD COLUMN "country_code" text,
  ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;
--> statement-breakpoint
UPDATE "analytics"."events" SET "occurred_at" = "created_at";
--> statement-breakpoint

ALTER TABLE "events"."outbox" ADD COLUMN "locked_by" text;
--> statement-breakpoint

CREATE TABLE "users"."emails" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL REFERENCES "users"."accounts"("id") ON DELETE cascade,
  "email" text NOT NULL,
  "normalized_email" text NOT NULL,
  "is_primary" boolean DEFAULT true NOT NULL,
  "verified_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "emails_normalized_unique" UNIQUE("normalized_email")
);
--> statement-breakpoint
INSERT INTO "users"."emails" ("account_id", "email", "normalized_email", "is_primary", "verified_at", "created_at")
SELECT "id", "email", lower("email"), true, "created_at", "created_at" FROM "users"."accounts"
ON CONFLICT ("normalized_email") DO NOTHING;
--> statement-breakpoint
CREATE TABLE "users"."profiles" (
  "account_id" uuid PRIMARY KEY REFERENCES "users"."accounts"("id") ON DELETE cascade,
  "display_name" text,
  "avatar_url" text,
  "bio" text,
  "website_url" text,
  "country_code" text,
  "timezone" text,
  "locale" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "users"."profiles" ("account_id", "display_name")
SELECT "id", "display_name" FROM "users"."accounts" ON CONFLICT DO NOTHING;
--> statement-breakpoint

CREATE TABLE "auth"."token_grants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "token_id" uuid NOT NULL REFERENCES "auth"."tokens"("id") ON DELETE cascade,
  "permission" text NOT NULL,
  "resource_type" "auth"."grant_resource" NOT NULL,
  "resource_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "auth"."token_grants" ("token_id", "permission", "resource_type")
SELECT t.id, scope.value, 'global'::"auth"."grant_resource"
FROM "auth"."tokens" t
CROSS JOIN LATERAL jsonb_array_elements_text(t.scopes) AS scope(value)
ON CONFLICT DO NOTHING;
--> statement-breakpoint

CREATE TABLE "orgs"."teams" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "orgs"."organizations"("id") ON DELETE cascade,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "teams_organization_slug_unique" UNIQUE("organization_id", "slug")
);
--> statement-breakpoint
CREATE TABLE "orgs"."team_members" (
  "team_id" uuid NOT NULL REFERENCES "orgs"."teams"("id") ON DELETE cascade,
  "account_id" uuid NOT NULL REFERENCES "users"."accounts"("id") ON DELETE cascade,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "team_members_pkey" PRIMARY KEY("team_id", "account_id")
);
--> statement-breakpoint

CREATE TABLE "catalog"."countries" (
  "code" text PRIMARY KEY,
  "alpha3" text NOT NULL,
  "numeric_code" text,
  "name" text NOT NULL,
  "region_code" text,
  "subregion_code" text,
  "calling_code" text,
  "currency_code" text,
  "status" "catalog"."catalog_status" DEFAULT 'active' NOT NULL,
  "source_version" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog"."timezones" (
  "id" text PRIMARY KEY,
  "country_code" text REFERENCES "catalog"."countries"("code"),
  "canonical_id" text NOT NULL,
  "replacement_id" text,
  "status" "catalog"."catalog_status" DEFAULT 'active' NOT NULL,
  "tzdb_version" text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog"."languages" (
  "code" text PRIMARY KEY,
  "name" text NOT NULL,
  "native_name" text,
  "script_code" text,
  "direction" text DEFAULT 'ltr' NOT NULL,
  "status" "catalog"."catalog_status" DEFAULT 'active' NOT NULL,
  "source_version" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog"."licenses" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "osi_approved" boolean DEFAULT false NOT NULL,
  "deprecated" boolean DEFAULT false NOT NULL,
  "reference_url" text,
  "source_version" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog"."categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "parent_id" uuid,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text,
  "icon" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "status" "catalog"."catalog_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "categories_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "catalog"."categories"("id") ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE "catalog"."tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text,
  "status" "catalog"."catalog_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog"."capabilities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text,
  "status" "catalog"."catalog_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog"."ai_providers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "website_url" text,
  "logo_url" text,
  "status" "catalog"."catalog_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog"."ai_model_families" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider_id" uuid NOT NULL REFERENCES "catalog"."ai_providers"("id") ON DELETE cascade,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ai_model_families_provider_slug_unique" UNIQUE("provider_id", "slug")
);
--> statement-breakpoint
CREATE TABLE "catalog"."ai_models" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider_id" uuid NOT NULL REFERENCES "catalog"."ai_providers"("id") ON DELETE cascade,
  "family_id" uuid REFERENCES "catalog"."ai_model_families"("id") ON DELETE set null,
  "slug" text NOT NULL,
  "display_name" text NOT NULL,
  "provider_model_id" text,
  "release_date" timestamp with time zone,
  "knowledge_cutoff" timestamp with time zone,
  "context_window" integer,
  "supports_tools" boolean DEFAULT false NOT NULL,
  "supports_vision" boolean DEFAULT false NOT NULL,
  "supports_reasoning" boolean DEFAULT false NOT NULL,
  "supports_structured_output" boolean DEFAULT false NOT NULL,
  "status" "catalog"."model_status" DEFAULT 'active' NOT NULL,
  "deprecated_at" timestamp with time zone,
  "replaced_by_id" uuid,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ai_models_provider_slug_unique" UNIQUE("provider_id", "slug")
);
--> statement-breakpoint
CREATE TABLE "catalog"."agent_clients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider_id" uuid REFERENCES "catalog"."ai_providers"("id") ON DELETE set null,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "website_url" text,
  "supports_skill_md" boolean DEFAULT false NOT NULL,
  "supports_tools" boolean DEFAULT false NOT NULL,
  "supports_mcp" boolean DEFAULT false NOT NULL,
  "status" "catalog"."catalog_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog"."programming_languages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "website_url" text,
  "status" "catalog"."catalog_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog"."frameworks" (LIKE "catalog"."programming_languages" INCLUDING ALL);
--> statement-breakpoint
CREATE TABLE "catalog"."runtimes" (LIKE "catalog"."programming_languages" INCLUDING ALL);
--> statement-breakpoint
CREATE TABLE "catalog"."package_managers" (LIKE "catalog"."programming_languages" INCLUDING ALL);
--> statement-breakpoint
CREATE TABLE "catalog"."seed_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source" text NOT NULL,
  "source_version" text NOT NULL,
  "checksum" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE "storage"."objects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider" "storage"."provider" DEFAULT 'database' NOT NULL,
  "bucket" text,
  "object_key" text,
  "content_type" text NOT NULL,
  "size_bytes" bigint NOT NULL CHECK ("size_bytes" >= 0),
  "sha256" text NOT NULL,
  "sha512" text NOT NULL UNIQUE,
  "compression" text,
  "payload" bytea,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "verified_at" timestamp with time zone,
  "deleted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storage"."uploads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider" "storage"."provider" NOT NULL,
  "object_key" text NOT NULL,
  "status" "storage"."upload_status" DEFAULT 'pending' NOT NULL,
  "expected_size_bytes" bigint,
  "expected_sha512" text,
  "expires_at" timestamp with time zone NOT NULL,
  "completed_object_id" uuid REFERENCES "storage"."objects"("id") ON DELETE set null,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "registry"."versions" ADD CONSTRAINT "versions_artifact_id_objects_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "storage"."objects"("id") ON DELETE restrict;
--> statement-breakpoint

CREATE TABLE "registry"."tags" (
  "package_id" uuid NOT NULL REFERENCES "registry"."packages"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "version_id" uuid NOT NULL REFERENCES "registry"."versions"("id") ON DELETE restrict,
  "updated_by_account_id" uuid NOT NULL REFERENCES "users"."accounts"("id") ON DELETE restrict,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "registry_tags_pkey" PRIMARY KEY("package_id", "name")
);
--> statement-breakpoint
INSERT INTO "registry"."tags" ("package_id", "name", "version_id", "updated_by_account_id", "updated_at")
SELECT p.id, 'latest', v.id, v.published_by_account_id, now()
FROM "registry"."packages" p
JOIN "registry"."versions" v ON v.package_id = p.id AND v.version = p.latest_version
ON CONFLICT DO NOTHING;
--> statement-breakpoint
CREATE TABLE "registry"."package_categories" (
  "package_id" uuid NOT NULL REFERENCES "registry"."packages"("id") ON DELETE cascade,
  "category_id" uuid NOT NULL REFERENCES "catalog"."categories"("id") ON DELETE restrict,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "package_categories_pkey" PRIMARY KEY("package_id", "category_id")
);
--> statement-breakpoint
CREATE TABLE "registry"."package_tags" (
  "package_id" uuid NOT NULL REFERENCES "registry"."packages"("id") ON DELETE cascade,
  "tag_id" uuid NOT NULL REFERENCES "catalog"."tags"("id") ON DELETE restrict,
  "source" "registry"."tag_source" DEFAULT 'publisher' NOT NULL,
  "confidence" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "package_tags_pkey" PRIMARY KEY("package_id", "tag_id")
);
--> statement-breakpoint
CREATE TABLE "registry"."package_models" (
  "package_id" uuid NOT NULL REFERENCES "registry"."packages"("id") ON DELETE cascade,
  "model_id" uuid NOT NULL REFERENCES "catalog"."ai_models"("id") ON DELETE restrict,
  "compatibility" "registry"."compatibility" NOT NULL,
  "notes" text,
  "verified_at" timestamp with time zone,
  "verified_by_account_id" uuid REFERENCES "users"."accounts"("id") ON DELETE set null,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "package_models_pkey" PRIMARY KEY("package_id", "model_id")
);
--> statement-breakpoint
CREATE TABLE "registry"."package_clients" (
  "package_id" uuid NOT NULL REFERENCES "registry"."packages"("id") ON DELETE cascade,
  "client_id" uuid NOT NULL REFERENCES "catalog"."agent_clients"("id") ON DELETE restrict,
  "compatibility" "registry"."compatibility" NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "package_clients_pkey" PRIMARY KEY("package_id", "client_id")
);
--> statement-breakpoint
CREATE TABLE "registry"."package_capabilities" (
  "package_id" uuid NOT NULL REFERENCES "registry"."packages"("id") ON DELETE cascade,
  "capability_id" uuid NOT NULL REFERENCES "catalog"."capabilities"("id") ON DELETE restrict,
  "required" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "package_capabilities_pkey" PRIMARY KEY("package_id", "capability_id")
);
--> statement-breakpoint
CREATE TABLE "registry"."package_programming_languages" (
  "package_id" uuid NOT NULL REFERENCES "registry"."packages"("id") ON DELETE cascade,
  "reference_id" uuid NOT NULL REFERENCES "catalog"."programming_languages"("id") ON DELETE restrict,
  "minimum_version" text,
  "maximum_version" text,
  "compatibility" "registry"."compatibility" DEFAULT 'compatible' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "package_programming_languages_pkey" PRIMARY KEY("package_id", "reference_id")
);
--> statement-breakpoint
CREATE TABLE "registry"."package_frameworks" (LIKE "registry"."package_programming_languages" INCLUDING ALL);
--> statement-breakpoint
ALTER TABLE "registry"."package_frameworks" ADD CONSTRAINT "package_frameworks_reference_fk" FOREIGN KEY ("reference_id") REFERENCES "catalog"."frameworks"("id") ON DELETE restrict;
--> statement-breakpoint
CREATE TABLE "registry"."package_runtimes" (LIKE "registry"."package_programming_languages" INCLUDING ALL);
--> statement-breakpoint
ALTER TABLE "registry"."package_runtimes" ADD CONSTRAINT "package_runtimes_reference_fk" FOREIGN KEY ("reference_id") REFERENCES "catalog"."runtimes"("id") ON DELETE restrict;
--> statement-breakpoint
CREATE TABLE "registry"."package_managers" (LIKE "registry"."package_programming_languages" INCLUDING ALL);
--> statement-breakpoint
ALTER TABLE "registry"."package_managers" ADD CONSTRAINT "package_managers_reference_fk" FOREIGN KEY ("reference_id") REFERENCES "catalog"."package_managers"("id") ON DELETE restrict;
--> statement-breakpoint
CREATE TABLE "registry"."access" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "package_id" uuid NOT NULL REFERENCES "registry"."packages"("id") ON DELETE cascade,
  "subject_type" "registry"."access_subject" NOT NULL,
  "account_id" uuid REFERENCES "users"."accounts"("id") ON DELETE cascade,
  "team_id" uuid REFERENCES "orgs"."teams"("id") ON DELETE cascade,
  "permission" "registry"."access_permission" NOT NULL,
  "created_by_account_id" uuid NOT NULL REFERENCES "users"."accounts"("id") ON DELETE restrict,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "access_subject_check" CHECK ((subject_type = 'account' AND account_id IS NOT NULL AND team_id IS NULL) OR (subject_type = 'team' AND account_id IS NULL AND team_id IS NOT NULL))
);
--> statement-breakpoint

CREATE TABLE "analytics"."package_daily" (
  "package_id" uuid NOT NULL REFERENCES "registry"."packages"("id") ON DELETE cascade,
  "day" date NOT NULL,
  "views" bigint DEFAULT 0 NOT NULL,
  "downloads" bigint DEFAULT 0 NOT NULL,
  "unique_downloaders" bigint DEFAULT 0 NOT NULL,
  "resolves" bigint DEFAULT 0 NOT NULL,
  "publishes" bigint DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "package_daily_pkey" PRIMARY KEY("package_id", "day")
);
--> statement-breakpoint
INSERT INTO "analytics"."package_daily" (package_id, day, views, downloads, publishes)
SELECT package_id, event_day,
  count(*) FILTER (WHERE event_type = 'view'),
  count(*) FILTER (WHERE event_type = 'download'),
  count(*) FILTER (WHERE event_type = 'publish')
FROM "analytics"."events"
GROUP BY package_id, event_day
ON CONFLICT DO NOTHING;
--> statement-breakpoint

CREATE TABLE "events"."deliveries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL REFERENCES "events"."outbox"("id") ON DELETE cascade,
  "consumer" text NOT NULL,
  "status" "events"."delivery_status" DEFAULT 'pending' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "available_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_error" text,
  "delivered_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "deliveries_event_consumer_unique" UNIQUE("event_id", "consumer")
);
--> statement-breakpoint
CREATE TABLE "events"."dead_letters" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid REFERENCES "events"."outbox"("id") ON DELETE set null,
  "consumer" text NOT NULL,
  "payload" jsonb NOT NULL,
  "error" text NOT NULL,
  "failed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "replayed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE "platform"."roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."role_permissions" (
  "role_id" uuid NOT NULL REFERENCES "platform"."roles"("id") ON DELETE cascade,
  "permission_id" uuid NOT NULL REFERENCES "platform"."permissions"("id") ON DELETE cascade,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY("role_id", "permission_id")
);
--> statement-breakpoint
CREATE TABLE "platform"."admin_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL REFERENCES "users"."accounts"("id") ON DELETE cascade,
  "role_id" uuid NOT NULL REFERENCES "platform"."roles"("id") ON DELETE restrict,
  "granted_by_account_id" uuid REFERENCES "users"."accounts"("id") ON DELETE set null,
  "reason" text,
  "expires_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."moderation_cases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "target_type" text NOT NULL,
  "target_id" uuid NOT NULL,
  "status" text DEFAULT 'open' NOT NULL,
  "reason" text NOT NULL,
  "opened_by_account_id" uuid REFERENCES "users"."accounts"("id") ON DELETE set null,
  "resolved_by_account_id" uuid REFERENCES "users"."accounts"("id") ON DELETE set null,
  "resolved_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE "audit"."entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
  "actor_type" text NOT NULL,
  "actor_id" uuid REFERENCES "users"."accounts"("id") ON DELETE set null,
  "action" text NOT NULL,
  "target_type" text NOT NULL,
  "target_id" text NOT NULL,
  "organization_id" uuid,
  "request_id" text,
  "ip_hash" text,
  "user_agent" text,
  "before" jsonb,
  "after" jsonb,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint

INSERT INTO "catalog"."categories" (slug, name, description, sort_order) VALUES
  ('development', 'Development', 'Software engineering and implementation skills', 10),
  ('backend', 'Backend', 'Backend services, APIs, and domain logic', 20),
  ('frontend', 'Frontend', 'Web UI and frontend architecture', 30),
  ('mobile', 'Mobile', 'Mobile application engineering', 40),
  ('devops', 'DevOps', 'Deployment, infrastructure, and operations', 50),
  ('database', 'Database', 'Data modeling, migrations, and query design', 60),
  ('testing', 'Testing', 'Testing, verification, and quality engineering', 70),
  ('security', 'Security', 'Application and infrastructure security', 80),
  ('planning', 'Planning', 'Technical planning and decomposition', 90),
  ('code-review', 'Code review', 'Reviewing changes and preventing regressions', 100),
  ('debugging', 'Debugging', 'Diagnosis and repair workflows', 110),
  ('documentation', 'Documentation', 'Technical documentation and knowledge transfer', 120)
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalog"."capabilities" (slug, name, description) VALUES
  ('filesystem', 'Filesystem access', 'Reads or writes project files'),
  ('shell', 'Shell execution', 'Runs local commands'),
  ('network', 'Network access', 'Accesses remote services'),
  ('git', 'Git operations', 'Reads or changes Git state'),
  ('mcp', 'MCP tools', 'Uses Model Context Protocol tools'),
  ('browser', 'Browser automation', 'Uses a browser or browser automation'),
  ('database', 'Database access', 'Reads or writes databases')
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalog"."ai_providers" (slug, name, website_url) VALUES
  ('openai', 'OpenAI', 'https://openai.com'),
  ('anthropic', 'Anthropic', 'https://anthropic.com'),
  ('google', 'Google', 'https://ai.google'),
  ('moonshot-ai', 'Moonshot AI', 'https://moonshot.ai'),
  ('deepseek', 'DeepSeek', 'https://deepseek.com'),
  ('mistral-ai', 'Mistral AI', 'https://mistral.ai'),
  ('meta', 'Meta', 'https://ai.meta.com'),
  ('xai', 'xAI', 'https://x.ai'),
  ('alibaba', 'Alibaba', 'https://qwen.ai')
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalog"."ai_model_families" (provider_id, slug, name)
SELECT p.id, v.slug, v.name FROM "catalog"."ai_providers" p
JOIN (VALUES
  ('openai','gpt','GPT'), ('anthropic','claude','Claude'), ('google','gemini','Gemini'),
  ('moonshot-ai','kimi','Kimi'), ('deepseek','deepseek','DeepSeek'),
  ('mistral-ai','mistral','Mistral'), ('meta','llama','Llama'),
  ('xai','grok','Grok'), ('alibaba','qwen','Qwen')
) AS v(provider_slug, slug, name) ON p.slug = v.provider_slug
ON CONFLICT (provider_id, slug) DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalog"."ai_models" (provider_id, family_id, slug, display_name, status)
SELECT f.provider_id, f.id, f.slug, f.name, 'active'::"catalog"."model_status"
FROM "catalog"."ai_model_families" f
ON CONFLICT (provider_id, slug) DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalog"."agent_clients" (slug, name, supports_skill_md, supports_tools, supports_mcp) VALUES
  ('claude-code', 'Claude Code', true, true, true),
  ('codex-cli', 'Codex CLI', true, true, true),
  ('gemini-cli', 'Gemini CLI', true, true, true),
  ('cursor', 'Cursor', false, true, true),
  ('github-copilot', 'GitHub Copilot', false, true, true),
  ('windsurf', 'Windsurf', false, true, true),
  ('opencode', 'OpenCode', true, true, true),
  ('cline', 'Cline', false, true, true),
  ('roo-code', 'Roo Code', false, true, true)
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalog"."programming_languages" (slug, name) VALUES
  ('typescript','TypeScript'), ('javascript','JavaScript'), ('python','Python'),
  ('rust','Rust'), ('go','Go'), ('dart','Dart'), ('java','Java'),
  ('kotlin','Kotlin'), ('swift','Swift'), ('sql','SQL'), ('shell','Shell')
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalog"."frameworks" (slug, name) VALUES
  ('nextjs','Next.js'), ('nestjs','NestJS'), ('react','React'), ('flutter','Flutter'),
  ('fastify','Fastify'), ('express','Express'), ('django','Django'), ('spring','Spring')
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalog"."runtimes" (slug, name) VALUES
  ('nodejs','Node.js'), ('deno','Deno'), ('bun','Bun'), ('python','Python'), ('jvm','JVM')
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalog"."package_managers" (slug, name) VALUES
  ('pnpm','pnpm'), ('npm','npm'), ('yarn','Yarn'), ('cargo','Cargo'),
  ('pip','pip'), ('uv','uv'), ('pub','pub'), ('maven','Maven'), ('gradle','Gradle')
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint

INSERT INTO "platform"."roles" (slug, name, description) VALUES
  ('super_admin','Super administrator','Unrestricted emergency platform administration'),
  ('platform_admin','Platform administrator','General platform administration'),
  ('registry_moderator','Registry moderator','Package and namespace moderation'),
  ('security_reviewer','Security reviewer','Security review and quarantine decisions'),
  ('support_agent','Support agent','Customer support access'),
  ('catalog_editor','Catalog editor','Reference catalog maintenance'),
  ('analytics_viewer','Analytics viewer','Read-only platform analytics')
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint
INSERT INTO "platform"."permissions" (slug, description) VALUES
  ('accounts.read','Read account information'), ('accounts.suspend','Suspend accounts'),
  ('organizations.read','Read organizations'), ('organizations.suspend','Suspend organizations'),
  ('packages.read_private','Read private packages for authorized investigations'),
  ('packages.quarantine','Quarantine registry packages'), ('packages.restore','Restore quarantined packages'),
  ('versions.yank','Yank immutable package versions'), ('catalog.manage','Manage reference catalogs'),
  ('models.manage','Manage AI model references'), ('moderation.manage','Manage moderation cases'),
  ('audit.read','Read audit history'), ('events.replay','Replay failed events')
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint

CREATE INDEX "accounts_status_idx" ON "users"."accounts" ("status");
--> statement-breakpoint
CREATE INDEX "emails_account_idx" ON "users"."emails" ("account_id");
--> statement-breakpoint
CREATE INDEX "sessions_account_expiry_idx" ON "auth"."sessions" ("account_id", "expires_at");
--> statement-breakpoint
CREATE INDEX "tokens_account_idx_v2" ON "auth"."tokens" ("account_id", "status");
--> statement-breakpoint
CREATE INDEX "memberships_account_idx_v2" ON "orgs"."memberships" ("account_id", "status");
--> statement-breakpoint
CREATE INDEX "packages_namespace_status_idx" ON "registry"."packages" ("namespace_id", "status", "updated_at");
--> statement-breakpoint
CREATE INDEX "versions_package_release_idx" ON "registry"."versions" ("package_id", "release_number" DESC);
--> statement-breakpoint
CREATE INDEX "analytics_events_package_occurred_idx" ON "analytics"."events" ("package_id", "occurred_at");
--> statement-breakpoint
CREATE INDEX "deliveries_dispatch_idx" ON "events"."deliveries" ("status", "available_at");
--> statement-breakpoint
CREATE INDEX "audit_entries_target_idx" ON "audit"."entries" ("target_type", "target_id", "occurred_at" DESC);
--> statement-breakpoint

REVOKE CREATE ON SCHEMA "public" FROM PUBLIC;
