DO $$ BEGIN
  CREATE TYPE "registry"."source_extension" AS ENUM ('sl', 'skillib');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "registry"."versions"
  ADD COLUMN IF NOT EXISTS "source_extension" "registry"."source_extension" NOT NULL DEFAULT 'skillib',
  ADD COLUMN IF NOT EXISTS "language_version" text NOT NULL DEFAULT '0.1',
  ADD COLUMN IF NOT EXISTS "compiler_version" text NOT NULL DEFAULT '0.1.0',
  ADD COLUMN IF NOT EXISTS "source_text" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "compiled_ir" jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "source_hash" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "ir_hash" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "dependencies" jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "permissions" jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "diagnostics" jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS "versions_source_hash_idx"
  ON "registry"."versions" ("source_hash");
CREATE INDEX IF NOT EXISTS "versions_ir_hash_idx"
  ON "registry"."versions" ("ir_hash");
