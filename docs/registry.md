# PostgreSQL Skill Registry

`apps/site` is a Next.js App Router application. Server Components render the landing, registry, package, and account surfaces; Route Handlers expose the CLI and browser APIs. Authorization is repeated in the data-access layer instead of being delegated to optimistic route protection.

## Storage

The hosted application uses PostgreSQL through Drizzle ORM and `postgres.js`. There is no website SQLite/libSQL fallback. The committed migrations under `apps/site/drizzle/` are applied before the application starts, and normal requests never create or alter tables.

Use a pooled PostgreSQL URL for serverless deployment. `DATABASE_PREPARE_STATEMENTS=false` is supported for transaction poolers that do not allow prepared statements.

The registry stores deterministic, validated skill bundles as PostgreSQL `jsonb`. Every version has a canonical SHA-512 digest. Bundles reject absolute paths, traversal, duplicate paths, symlinks, missing `SKILL.md`, and configured size limits before publication or installation.

## Identity and sessions

Website authentication is passwordless:

1. a user submits an email;
2. the OTP record and an `auth.login-otp.requested` outbox event commit together;
3. the SMTP dispatcher emails an eight-digit, ten-minute code;
4. only a keyed hash of the code is stored;
5. successful verification atomically consumes the OTP, creates the account and namespace when needed, and issues a database-backed session cookie;
6. the cookie is `HttpOnly`, `SameSite=Lax`, secure in production, and revocable.

OTP values are never returned by the API or displayed in development UI.

Organisation invitations use one-time `agt_join_...` codes with substantially more than twelve characters. Codes are hashed, bound to the invited email, expire after seven days, and are consumed transactionally when membership is created. Invitation creation and its email outbox event also commit together.

## Transactional email outbox

The `outbox_events` table contains retryable domain events. The dispatcher uses PostgreSQL row locking with `skip locked` semantics so multiple workers cannot send the same event concurrently.

Supported events:

```text
auth.login-otp.requested
organization.invitation.created
```

A request attempts immediate delivery after commit. If SMTP is temporarily unavailable, the event remains pending with a bounded exponential retry time. A cron job or worker calls:

```text
POST /api/internal/events/dispatch
Authorization: Bearer <EVENT_DISPATCH_SECRET>
```

SMTP is configured through `SMTP_HOST`, `SMTP_PORT`, `SMTP_AUTH`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, and the optional pool and timeout settings in `.env.example`.

## Namespaces and visibility

`registry_namespaces` is the canonical namespace table. Personal handles and organisation slugs therefore cannot collide. Publishing requires ownership of a personal namespace or an `owner`, `admin`, or `publisher` role in an organisation.

Public skills can be searched, viewed, resolved, and downloaded anonymously. Private skills require either an active member session or a live CLI token with `skills:read`. Publishing requires `skills:write`. Versions are immutable.

Publishing is one PostgreSQL transaction covering namespace authorization, skill creation or update, duplicate-version rejection, immutable version insertion, latest-version selection, and publication analytics.

## CLI credentials

Tokens are shown only once by the website and stored server-side only as a keyed hash plus a short visible prefix. `skillib login` validates a pasted token and stores it in `agents/.skillib/auth.json`, a generated git-ignored file with user-only filesystem permissions where supported. `SKILLIB_TOKEN` remains an explicit CI override.

## API

```text
GET  /api/v1/auth/me
GET  /api/v1/skills/search?q=<query>&sort=<popular|newest|updated>
GET  /api/v1/skills/:namespace/:name/resolve?version=<range>
GET  /api/v1/skills/:namespace/:name/download?version=<version>
POST /api/v1/skills/:namespace/:name/versions
POST /api/internal/events/dispatch
```

The registry records deduplicated daily view and download events and atomically increments aggregated counters beside each package.

## Required deployment order

```text
provision PostgreSQL
→ set DATABASE_URL and SMTP variables
→ run pnpm --filter @alidantech/skillib-site db:migrate
→ start the Next.js application
→ schedule the protected outbox dispatcher
```
