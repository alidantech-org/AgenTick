-- The executable schema lives in lib/db/schema.ts so serverless deployments can
-- initialize a fresh local or hosted libSQL database without filesystem reads.
-- Keep this file as a human-facing map of the registry data model.

-- Core tables:
-- accounts, sessions, login_otps
-- organizations, registry_namespaces, organization_members, organization_invites
-- api_tokens
-- skills, skill_versions, skill_events
