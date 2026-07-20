# Serverless Skill Registry

`apps/site` is a Next.js App Router application. Server Components render the
landing, registry, package, and account surfaces; Route Handlers expose the CLI
and browser APIs. Authorization is repeated in the data-access layer instead of
being delegated to optimistic route protection.

## Storage

Development uses local SQLite through a `file:` libSQL URL. Hosted serverless
instances use a shared remote libSQL/Turso URL because ephemeral function disks
cannot be a shared database. The schema is versioned through
`schema_migrations`, and related account, namespace, and membership writes use
libSQL batch transactions.

The registry stores deterministic, validated skill bundles as immutable JSON.
Every version has a canonical SHA-512 digest. Bundles reject absolute paths,
traversal, duplicate paths, symlinks, missing `SKILL.md`, and configured size
limits before publication or installation.

## Identity and sessions

Website authentication is passwordless:

1. a user submits an email;
2. Skillib emails an eight-digit, ten-minute code;
3. only a keyed hash of the code is stored;
4. successful verification creates or loads the account and issues a random
   database-backed session cookie;
5. the cookie is `HttpOnly`, `SameSite=Lax`, secure in production, and revocable.

Organisation invitations use one-time `agt_join_...` codes with substantially
more than twelve characters. Codes are hashed, bound to the invited email,
expire after seven days, and are consumed transactionally when membership is
created.

## Namespaces and visibility

`registry_namespaces` is the canonical namespace table. Personal handles and
organisation slugs therefore cannot collide. Publishing requires ownership of a
personal namespace or an `owner`, `admin`, or `publisher` role in an
organisation.

Public skills can be searched, viewed, resolved, and downloaded anonymously.
Private skills require either an active member session or a live CLI token with
`skills:read`. Publishing requires `skills:write`. Versions are immutable.

## CLI credentials

Tokens are shown only once by the website and stored server-side only as a keyed
hash plus a short visible prefix. `skillib login` validates a pasted token and
stores it in `agents/.skillib/auth.json`, a generated git-ignored file with
user-only filesystem permissions where supported. `SKILLIB_TOKEN` remains an
explicit CI override.

## API

```text
GET  /api/v1/auth/me
GET  /api/v1/skills/search?q=<query>&sort=<popular|newest|updated>
GET  /api/v1/skills/:namespace/:name/resolve?version=<range>
GET  /api/v1/skills/:namespace/:name/download?version=<version>
POST /api/v1/skills/:namespace/:name/versions
```

The registry records deduplicated daily view and download events and exposes
aggregated counts beside each package.
