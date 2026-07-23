# Active Tasks

Issue: #10
Plan: `agents/work/REGISTRY_UPGRADE_PLAN.md`

## Schema and migrations

- [x] Split database into domain schemas.
- [x] Export select and insert TypeScript types for schema entities.
- [x] Add data-preserving domain migration.
- [ ] Rename registry versions to releases consistently.
- [ ] Remove unsupported binary-column declaration and finalize artifact storage.
- [ ] Add final production constraints and indexes.
- [ ] Add `db:verify` migration validation.

## Registry services

- [ ] Replace legacy skill/version internals with package/release terminology.
- [ ] Resolve namespace IDs during package creation.
- [ ] Allocate integer release numbers transactionally.
- [ ] Implement distribution tags and release resolution.
- [ ] Implement release lifecycle and yanking.
- [ ] Move analytics writes to package/release identifiers and daily rollups.

## Catalog

- [ ] Add idempotent reference seed framework.
- [ ] Seed countries, timezones, languages, and licenses.
- [ ] Seed categories, tags, capabilities, AI providers/models, agent clients, and technologies.
- [ ] Add catalog query services and APIs.
- [ ] Add reusable catalog UI selectors.

## Site features

- [ ] Upgrade personal package dashboard and package management UI.
- [ ] Upgrade organization registry dashboard, teams, and access grants.
- [ ] Upgrade public registry discovery, filters, package pages, and release pages.
- [ ] Upgrade user profile, emails, sessions, and API token management.
- [ ] Add admin, catalog management, moderation, events, and audit pages.

## Reliability and security

- [ ] Add platform permission helpers.
- [ ] Add append-only audit service and mutation audit writes.
- [ ] Complete outbox deliveries and dead-letter replay.
- [ ] Add clean-database and existing-database migration tests.

## CLI

- [ ] Upgrade push for releases and tags.
- [ ] Upgrade pull for release numbers, versions, ranges, and tags.
- [ ] Upgrade lockfile with release, version, integrity, and artifact identity.

## Final validation

- [ ] Formatting passes.
- [ ] Typecheck passes.
- [ ] Tests pass.
- [ ] Production build passes.
- [ ] PostgreSQL migrations, seeds, and verification pass.
- [ ] SMTP, CLI, registry, admin, and runtime smoke checks pass.
- [ ] Handoff completed.
- [ ] Issue #10 closed.
