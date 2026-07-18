# Research Notes

The initial design follows these primary-source findings:

1. Agent Skills are filesystem packages centered on a required `SKILL.md` with `name` and `description`, with optional scripts, references, and assets. Progressive disclosure favors a concise primary file and on-demand supporting resources.
2. Skills can execute instructions or bundled code, so provenance, exact version pinning, integrity verification, and read-only installation are security boundaries.
3. Git provides `rev-parse --show-toplevel` specifically for resolving the repository working-tree root from a nested current directory.
4. Native file watching has platform and network-filesystem caveats; AgenTick uses Chokidar over Node facilities and keeps explicit ignore rules.
5. Node's SQLite module is available without the experimental flag from Node 22.13, but JSONL remains the canonical log and SQLite the derived index.
6. Next.js App Router Route Handlers provide the serverless HTTP surface. Secrets and database clients remain server-only.
7. Local SQLite files work for development, while hosted serverless deployments require shared remote SQLite-compatible storage; libSQL supports both local `file:` URLs and remote serverless access.

## Sources

- https://github.com/agentskills/agentskills
- https://github.com/anthropics/skills
- https://learn.microsoft.com/en-us/agent-framework/agents/skills
- https://git-scm.com/docs/git-rev-parse
- https://nodejs.org/api/fs.html
- https://nodejs.org/api/sqlite.html
- https://nextjs.org/docs/app/getting-started/route-handlers
- https://nextjs.org/docs/app/guides/data-security
- https://docs.turso.tech/sdk/ts/reference
