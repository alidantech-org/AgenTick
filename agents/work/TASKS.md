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
- [x] Resolve namespace IDs during package creation.
- [x] Allocate integer release numbers transactionally.
- [ ] Implement distribution tags and release resolution.
- [ ] Implement release lifecycle and yanking.
- [ ] Move analytics writes to package/release identifiers and daily rollups.

## Catalog

- [ ] Add idempotent reference seed framework.
- [ ] Seed countries, timezones, languages, and licenses.
- [ ] Seed categories, tags, capabilities, AI providers/models, agent clients, and technologies.
- [ ] Add catalog query services and APIs.
- [ ] Add reusable catalog UI selectors.

## Site design system

- [ ] Establish one modern npm-inspired application shell and semantic design system across public, account, organization, and admin routes.
- [x] Add global skip navigation, visible focus treatment, reduced-motion behavior, touch targets, theme color-scheme support, and typography wrapping rules.
- [x] Add reusable accessible form field and form section primitives.
- [ ] Audit every interactive control against the latest Vercel Web Interface Guidelines.
- [ ] Standardize loading, success, inline error, empty, not-found, and destructive confirmation patterns.

## Page-by-page redesign

- [ ] Validate and complete `/login` and `/signup` passwordless forms.
- [ ] Upgrade `/join` invitation acceptance flow.
- [ ] Upgrade `/guides` documentation experience.
- [ ] Upgrade `/skills` discovery with complete URL-backed filters and pagination.
- [ ] Upgrade `/skills/[namespace]/[name]` package overview.
- [ ] Add and polish package release detail pages.
- [ ] Upgrade `/account` overview.
- [ ] Upgrade `/account/profile` with editable identity, verified emails, country, timezone, locale, and lifecycle controls.
- [x] Upgrade `/account/security` with current-device detection, individual revocation, and revoke-all-other-sessions.
- [ ] Upgrade `/account/tokens` with granular scopes, resource restrictions, expiry, last-used details, and revocation.
- [ ] Upgrade `/account/skills` personal package dashboard and management UI.
- [ ] Upgrade `/account/organisations` organization directory and creation flow.
- [ ] Upgrade `/account/organisation/[slug]/skills` organization packages, teams, and access grants.
- [ ] Add and polish admin, catalog management, moderation, events, and audit pages.

## Site feature completeness

- [ ] Upgrade personal package dashboard and package management UI.
- [ ] Upgrade organization registry dashboard, teams, and access grants.
- [ ] Upgrade public registry discovery with search, keyword facets, tags, categories, AI models, agent clients, languages, frameworks, runtimes, package managers, licenses, sort, and pagination.
- [ ] Upgrade public package pages with releases, tags, provenance, compatibility, files, integrity, analytics, publisher details, and install commands.
- [ ] Upgrade user profile with editable identity, verified emails, country, timezone, locale, and account lifecycle controls.
- [ ] Upgrade API token management with granular scopes, resource restrictions, expiry, last-used details, and revocation.
- [ ] Add route-level loading, empty, not-found, and error states for all data-backed application routes.

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
