# Architecture

- `packages/skillib`: CLI and local runtime.
- `packages/config`: YAML schema and parsing.
- `packages/skill-lib`: open skill format, integrity, lock, and registry client.
- `packages/shared`: shared event and finding contracts.
- `packages/ui`: shared website UI.
- `apps/site`: serverless Next.js registry and account service.

The local runtime discovers the Git root, loads `agents/skillib.yml`, watches configured files, appends JSONL events, indexes them in SQLite, and exposes a localhost dashboard.
