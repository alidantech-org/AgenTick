# Serverless Skill Registry

`apps/site` is a Next.js App Router application. Route Handlers provide the HTTP
registry API and server-only modules own secrets, token verification, and data
access.

## Storage

Development uses local SQLite through a `file:` libSQL URL. Hosted serverless
instances use a remote libSQL/Turso URL so all function instances share the same
SQLite-compatible database. Skill bundles are initially stored as immutable JSON
inside SQLite; object storage can be introduced later without changing the lock
or bundle format.

## Accounts and tokens

Publishing requires an account. CLI tokens are:

- displayed only once;
- stored by the server only as a keyed hash plus a visible prefix;
- scoped, for example `skills:read` and `skills:write`;
- revocable and timestamped;
- never accepted in query strings or written to project YAML/JSONL logs.

The initial CLI accepts `AGENTICK_TOKEN`. A later `agentick login` command will
store the same token in the operating-system credential manager.

## API direction

```text
GET  /api/v1/skills/:namespace/:name/resolve?version=<range>
GET  /api/v1/skills/:namespace/:name/versions/:version
POST /api/v1/skills/:namespace/:name/versions
```

Resolve and download are anonymous for public skills and authenticated for
private skills. Publishing requires namespace ownership and `skills:write`.
Published versions are immutable; corrections require a new version or an
explicit yank that preserves history.
