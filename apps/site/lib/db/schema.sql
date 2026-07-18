PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS namespaces (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  owner_account_id TEXT NOT NULL REFERENCES accounts(id),
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS namespace_members (
  namespace_id TEXT NOT NULL REFERENCES namespaces(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  role TEXT NOT NULL CHECK(role IN ('owner', 'publisher', 'viewer')),
  created_at TEXT NOT NULL,
  PRIMARY KEY(namespace_id, account_id)
) STRICT;

CREATE TABLE IF NOT EXISTS api_tokens (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  token_prefix TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  scopes_json TEXT NOT NULL,
  last_used_at TEXT,
  expires_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  namespace_id TEXT NOT NULL REFERENCES namespaces(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK(visibility IN ('public', 'private')),
  created_at TEXT NOT NULL,
  UNIQUE(namespace_id, name)
) STRICT;

CREATE TABLE IF NOT EXISTS skill_versions (
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL REFERENCES skills(id),
  version TEXT NOT NULL,
  integrity TEXT NOT NULL,
  bundle_json TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  published_by_account_id TEXT NOT NULL REFERENCES accounts(id),
  published_at TEXT NOT NULL,
  yanked_at TEXT,
  UNIQUE(skill_id, version)
) STRICT;

CREATE INDEX IF NOT EXISTS skills_namespace_idx ON skills(namespace_id, name);
CREATE INDEX IF NOT EXISTS skill_versions_skill_idx ON skill_versions(skill_id, published_at DESC);
CREATE INDEX IF NOT EXISTS api_tokens_prefix_idx ON api_tokens(token_prefix);
