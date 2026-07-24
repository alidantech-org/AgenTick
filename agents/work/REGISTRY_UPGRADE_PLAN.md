# Skillib Registry Upgrade Plan

Issue: #10

## Goal

Complete the production domain-schema migration and connect every new capability to services, APIs, CLI, and UI.

## Execution order

1. Stabilize schema and migrations.
2. Migrate registry services to packages, releases, tags, and artifacts.
3. Add catalog seeds, services, APIs, and reusable selectors.
4. Upgrade publishing and public registry UI.
5. Upgrade users, sessions, organizations, teams, and invitations.
6. Add platform administration, moderation, audit, and reliable event delivery.
7. Upgrade CLI push, pull, tags, releases, and lockfile behavior.
8. Validate clean database and existing-database upgrade paths.
9. Run format, typecheck, tests, build, migration, seed, verification, SMTP, CLI, and runtime smoke checks.

## Completion rule

The work is complete only when every item in `agents/work/TASKS.md` is checked, all validation gates pass, the handoff is written, and issue #10 is closed.
