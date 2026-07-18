# AgenTick Development Instructions

- Preserve the pnpm TypeScript monorepo and the CLI/site/package boundaries.
- Keep user-project operation self-contained under `<git-root>/agents/`.
- Never require a root `AGENTS.md` or root AgenTick YAML file.
- `agentick init` must preserve existing files and append only its marked `.gitignore` block.
- Keep `packages/agentick/src/tool/` shallow and grouped by human workflow.
- JSONL is canonical audit history; SQLite is a derived local index.
- Registry skills use open `SKILL.md` compatibility, exact locks, integrity, and managed read-only installation.
