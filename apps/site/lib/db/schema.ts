export const SCHEMA_VERSION = 1;

export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    handle TEXT NOT NULL UNIQUE,
    display_name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  ) STRICT`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    user_agent TEXT,
    ip_hash TEXT
  ) STRICT`,
  `CREATE TABLE IF NOT EXISTS login_otps (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK(purpose IN ('sign-in')),
    otp_hash TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT NOT NULL,
    consumed_at TEXT,
    request_fingerprint TEXT NOT NULL,
    created_at TEXT NOT NULL
  ) STRICT`,
  `CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    owner_account_id TEXT NOT NULL REFERENCES accounts(id),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  ) STRICT`,
  `CREATE TABLE IF NOT EXISTS registry_namespaces (
    slug TEXT PRIMARY KEY,
    namespace_type TEXT NOT NULL CHECK(namespace_type IN ('user', 'organization')),
    owner_account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,
    organization_id TEXT UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    CHECK(
      (namespace_type = 'user' AND owner_account_id IS NOT NULL AND organization_id IS NULL)
      OR
      (namespace_type = 'organization' AND owner_account_id IS NULL AND organization_id IS NOT NULL)
    )
  ) STRICT`,
  `CREATE TABLE IF NOT EXISTS organization_members (
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'publisher', 'member')),
    created_at TEXT NOT NULL,
    PRIMARY KEY(organization_id, account_id)
  ) STRICT`,
  `CREATE TABLE IF NOT EXISTS organization_invites (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK(role IN ('admin', 'publisher', 'member')),
    created_by_account_id TEXT NOT NULL REFERENCES accounts(id),
    expires_at TEXT NOT NULL,
    accepted_at TEXT,
    created_at TEXT NOT NULL
  ) STRICT`,
  `CREATE TABLE IF NOT EXISTS api_tokens (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    token_prefix TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    scopes_json TEXT NOT NULL,
    last_used_at TEXT,
    expires_at TEXT,
    revoked_at TEXT,
    created_at TEXT NOT NULL
  ) STRICT`,
  `CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    namespace_slug TEXT NOT NULL REFERENCES registry_namespaces(slug),
    namespace_type TEXT NOT NULL CHECK(namespace_type IN ('user', 'organization')),
    owner_account_id TEXT NOT NULL REFERENCES accounts(id),
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    visibility TEXT NOT NULL CHECK(visibility IN ('public', 'private')),
    license TEXT,
    keywords_json TEXT NOT NULL DEFAULT '[]',
    latest_version TEXT,
    views_count INTEGER NOT NULL DEFAULT 0,
    downloads_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    CHECK(
      (namespace_type = 'user' AND organization_id IS NULL)
      OR
      (namespace_type = 'organization' AND organization_id IS NOT NULL)
    ),
    UNIQUE(namespace_slug, name)
  ) STRICT`,
  `CREATE TABLE IF NOT EXISTS skill_versions (
    id TEXT PRIMARY KEY,
    skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    integrity TEXT NOT NULL,
    bundle_json TEXT NOT NULL,
    metadata_json TEXT NOT NULL,
    published_by_account_id TEXT NOT NULL REFERENCES accounts(id),
    published_at TEXT NOT NULL,
    yanked_at TEXT,
    UNIQUE(skill_id, version)
  ) STRICT`,
  `CREATE TABLE IF NOT EXISTS skill_events (
    id TEXT PRIMARY KEY,
    skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    version_id TEXT REFERENCES skill_versions(id) ON DELETE SET NULL,
    account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK(event_type IN ('view', 'download', 'publish')),
    dedupe_key TEXT,
    event_day TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(skill_id, event_type, dedupe_key, event_day)
  ) STRICT`,
  `CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token_hash)`,
  `CREATE INDEX IF NOT EXISTS login_otps_fingerprint_idx ON login_otps(request_fingerprint, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS login_otps_email_idx ON login_otps(email, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS registry_namespaces_owner_idx ON registry_namespaces(owner_account_id)`,
  `CREATE INDEX IF NOT EXISTS organizations_owner_idx ON organizations(owner_account_id)`,
  `CREATE INDEX IF NOT EXISTS organization_invites_email_idx ON organization_invites(email, expires_at)`,
  `CREATE INDEX IF NOT EXISTS api_tokens_prefix_idx ON api_tokens(token_prefix)`,
  `CREATE INDEX IF NOT EXISTS skills_search_idx ON skills(visibility, namespace_slug, name)`,
  `CREATE INDEX IF NOT EXISTS skills_owner_idx ON skills(owner_account_id, updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS skills_org_idx ON skills(organization_id, updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS skill_versions_skill_idx ON skill_versions(skill_id, published_at DESC)`,
  `CREATE INDEX IF NOT EXISTS skill_events_skill_idx ON skill_events(skill_id, created_at DESC)`,
] as const;
