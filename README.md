# AgenTick

**Agent + tick ✅**

AgenTick watches project files during AI-assisted coding, verifies work against a
project-local `agents/` specification, and preserves auditable history.

## Principles

- A user project needs only an `agents/` directory.
- AgenTick never requires a root `AGENTS.md` or root configuration file.
- `agentick init` discovers the Git root from the current path, preserves all
  existing project files, and only appends a marked block to the root `.gitignore`.
- Skills follow the open Agent Skills `SKILL.md` structure and are declared,
  locked, and installed entirely under `agents/`.
- JSONL is the canonical append-only event history; SQLite is a derived local
  query index.
- Downloaded skills are integrity-checked, path-validated, read-only, and never
  auto-executed.

## Workspace

- `packages/agentick` — published CLI and local watcher runtime.
- `packages/config` — YAML schemas and defaults.
- `packages/skill-lib` — skill format, bundle validation, integrity, and registry primitives.
- `packages/shared` — shared events and finding types.
- `packages/ui` — shared website UI foundation.
- `apps/site` — Next.js serverless skill registry and account website.

## Initial CLI

```text
agentick init
agentick verify [--no-commands]
agentick watch [--port 4317]
agentick status
agentick history
agentick skills
agentick pull
agentick push agents/skills/my-skill --id namespace/my-skill --version 1.0.0
```

`pull` requires the registry URL environment variable configured in
`agents/agentick.yml`. `push` additionally requires `AGENTICK_TOKEN`.

## Development

```bash
corepack enable
pnpm install
pnpm typecheck
pnpm test
pnpm --filter @alidantech/agentick build
node packages/agentick/dist/cli/index.js init
```

Tracking: issue #1.
