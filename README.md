# Skillib

**Skill library ✅**

Skillib watches project files during AI-assisted coding, verifies work against a
project-local `agents/` specification, and preserves auditable history.

## Principles

- A user project needs only an `agents/` directory.
- Skillib never requires a root `AGENTS.md` or root configuration file.
- `skillib init` discovers the Git root from the current path, preserves all
  existing project files, and only appends a marked block to the root `.gitignore`.
- Skills follow the open Agent Skills `SKILL.md` structure and are declared,
  locked, and installed entirely under `agents/`.
- JSONL is the canonical append-only event history; SQLite is a derived local
  query index.
- Downloaded skills are integrity-checked, path-validated, read-only, and never
  auto-executed.

## Workspace

- `packages/skillib` — published `skillib` CLI and local watcher runtime.
- `packages/config` — YAML schemas and defaults.
- `packages/skill-lib` — skill format, bundle validation, integrity, and registry primitives.
- `packages/shared` — shared events and finding types.
- `packages/ui` — shared website UI foundation.
- `apps/site` — Next.js serverless skill registry and account website.

## Initial CLI

```text
skillib init
skillib verify [--no-commands]
skillib watch [--port 4317]
skillib status
skillib history
skillib skill list
skillib skill add namespace/review-skill@2.1.0
skillib skill remove namespace/review-skill
skillib pull
skillib login
skillib whoami
skillib push agents/skills/my-skill --id namespace/my-skill --version 1.0.0 --visibility private
```

`pull` requires the registry URL environment variable configured in
`agents/skillib.yml`. Public pulls are anonymous. Private pulls and publishing
use `SKILLIB_TOKEN` or the project credential saved by `skillib login` in the
git-ignored `agents/.skillib/auth.json` file.

## Development

```bash
corepack enable
pnpm install
pnpm typecheck
pnpm test
pnpm --filter skillib build
node packages/skillib/dist/cli/index.js init
```

The current registry and account milestone is tracked in issue #3 and PR #2.
