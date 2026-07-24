CREATE TYPE "namespace_type" AS ENUM ('user', 'organization');
--> statement-breakpoint
CREATE TYPE "organization_role" AS ENUM ('owner', 'admin', 'publisher', 'member');
--> statement-breakpoint
CREATE TYPE "invite_role" AS ENUM ('admin', 'publisher', 'member');
--> statement-breakpoint
CREATE TYPE "skill_visibility" AS ENUM ('public', 'private');
--> statement-breakpoint
CREATE TYPE "skill_event_type" AS ENUM ('view', 'download', 'publish');
--> statement-breakpoint
CREATE TYPE "outbox_status" AS ENUM ('pending', 'processing', 'sent', 'failed');
--> statement-breakpoint
CREATE TABLE "accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "handle" text NOT NULL,
  "display_name" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "accounts_email_unique" UNIQUE("email"),
  CONSTRAINT "accounts_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "user_agent" text,
  "ip_hash" text,
  CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "login_otps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "purpose" text DEFAULT 'sign-in' NOT NULL,
  "otp_hash" text NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "request_fingerprint" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "login_otps_purpose_check" CHECK ("purpose" = 'sign-in')
);
--> statement-breakpoint
CREATE TABLE "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "owner_account_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "registry_namespaces" (
  "slug" text PRIMARY KEY NOT NULL,
  "namespace_type" "namespace_type" NOT NULL,
  "owner_account_id" uuid,
  "organization_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "registry_namespaces_organization_unique" UNIQUE("organization_id"),
  CONSTRAINT "registry_namespaces_owner_check" CHECK (
    ("namespace_type" = 'user' AND "owner_account_id" IS NOT NULL AND "organization_id" IS NULL)
    OR
    ("namespace_type" = 'organization' AND "owner_account_id" IS NULL AND "organization_id" IS NOT NULL)
  )
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
  "organization_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "role" "organization_role" NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "organization_members_organization_id_account_id_pk" PRIMARY KEY("organization_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "organization_invites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "email" text NOT NULL,
  "code_hash" text NOT NULL,
  "role" "invite_role" NOT NULL,
  "created_by_account_id" uuid NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "accepted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "organization_invites_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
CREATE TABLE "api_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL,
  "token_prefix" text NOT NULL,
  "token_hash" text NOT NULL,
  "name" text NOT NULL,
  "scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "last_used_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "api_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "skills" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "namespace_slug" text NOT NULL,
  "namespace_type" "namespace_type" NOT NULL,
  "owner_account_id" uuid NOT NULL,
  "organization_id" uuid,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "visibility" "skill_visibility" NOT NULL,
  "license" text,
  "keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "latest_version" text,
  "views_count" bigint DEFAULT 0 NOT NULL,
  "downloads_count" bigint DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "skills_namespace_name_unique" UNIQUE("namespace_slug","name"),
  CONSTRAINT "skills_namespace_owner_check" CHECK (
    ("namespace_type" = 'user' AND "organization_id" IS NULL)
    OR
    ("namespace_type" = 'organization' AND "organization_id" IS NOT NULL)
  )
);
--> statement-breakpoint
CREATE TABLE "skill_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "skill_id" uuid NOT NULL,
  "version" text NOT NULL,
  "integrity" text NOT NULL,
  "bundle" jsonb NOT NULL,
  "metadata" jsonb NOT NULL,
  "published_by_account_id" uuid NOT NULL,
  "published_at" timestamp with time zone DEFAULT now() NOT NULL,
  "yanked_at" timestamp with time zone,
  CONSTRAINT "skill_versions_skill_version_unique" UNIQUE("skill_id","version")
);
--> statement-breakpoint
CREATE TABLE "skill_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "skill_id" uuid NOT NULL,
  "version_id" uuid,
  "account_id" uuid,
  "event_type" "skill_event_type" NOT NULL,
  "dedupe_key" text,
  "event_day" date NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "skill_events_dedupe_unique" UNIQUE("skill_id","event_type","dedupe_key","event_day")
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_type" text NOT NULL,
  "aggregate_type" text NOT NULL,
  "aggregate_id" text NOT NULL,
  "payload" jsonb NOT NULL,
  "status" "outbox_status" DEFAULT 'pending' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "available_at" timestamp with time zone DEFAULT now() NOT NULL,
  "locked_at" timestamp with time zone,
  "processed_at" timestamp with time zone,
  "last_error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_account_id_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict;
--> statement-breakpoint
ALTER TABLE "registry_namespaces" ADD CONSTRAINT "registry_namespaces_owner_account_id_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "registry_namespaces" ADD CONSTRAINT "registry_namespaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_created_by_account_id_accounts_id_fk" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict;
--> statement-breakpoint
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_namespace_slug_registry_namespaces_slug_fk" FOREIGN KEY ("namespace_slug") REFERENCES "public"."registry_namespaces"("slug") ON DELETE restrict;
--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_owner_account_id_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict;
--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "skill_versions" ADD CONSTRAINT "skill_versions_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "skill_versions" ADD CONSTRAINT "skill_versions_published_by_account_id_accounts_id_fk" FOREIGN KEY ("published_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict;
--> statement-breakpoint
ALTER TABLE "skill_events" ADD CONSTRAINT "skill_events_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "skill_events" ADD CONSTRAINT "skill_events_version_id_skill_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."skill_versions"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "skill_events" ADD CONSTRAINT "skill_events_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null;
--> statement-breakpoint
CREATE INDEX "login_otps_email_created_idx" ON "login_otps" USING btree ("email","created_at");
--> statement-breakpoint
CREATE INDEX "login_otps_fingerprint_created_idx" ON "login_otps" USING btree ("request_fingerprint","created_at");
--> statement-breakpoint
CREATE INDEX "registry_namespaces_owner_idx" ON "registry_namespaces" USING btree ("owner_account_id");
--> statement-breakpoint
CREATE INDEX "organization_members_account_idx" ON "organization_members" USING btree ("account_id");
--> statement-breakpoint
CREATE INDEX "organization_invites_email_expiry_idx" ON "organization_invites" USING btree ("email","expires_at");
--> statement-breakpoint
CREATE INDEX "api_tokens_account_idx" ON "api_tokens" USING btree ("account_id");
--> statement-breakpoint
CREATE INDEX "skills_public_sort_idx" ON "skills" USING btree ("visibility","downloads_count","views_count","updated_at");
--> statement-breakpoint
CREATE INDEX "skills_owner_idx" ON "skills" USING btree ("owner_account_id","updated_at");
--> statement-breakpoint
CREATE INDEX "skills_organization_idx" ON "skills" USING btree ("organization_id","updated_at");
--> statement-breakpoint
CREATE INDEX "skill_versions_skill_published_idx" ON "skill_versions" USING btree ("skill_id","published_at");
--> statement-breakpoint
CREATE INDEX "skill_events_skill_created_idx" ON "skill_events" USING btree ("skill_id","created_at");
--> statement-breakpoint
CREATE INDEX "outbox_events_dispatch_idx" ON "outbox_events" USING btree ("status","available_at","created_at");
--> statement-breakpoint
CREATE INDEX "skills_search_document_idx" ON "skills" USING gin (to_tsvector('english', coalesce("namespace_slug", '') || ' ' || coalesce("name", '') || ' ' || coalesce("description", '') || ' ' || coalesce("keywords"::text, '')));
