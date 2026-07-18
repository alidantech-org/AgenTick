# @alidantech/agentick

A project-local watcher, verifier, audit trail, and Agent Skill package manager.

```bash
pnpm dlx @alidantech/agentick init
agentick watch --port 4317
agentick verify

# The registry URL remains explicit and project-controlled.
export AGENTICK_REGISTRY_URL=https://agentick.example.com

# Public packages can be pulled anonymously.
agentick skill add johnte/backend-review@2.3.1

# Create a token in the website account, then paste it into the hidden prompt.
agentick login
agentick whoami
agentick push agents/skills/my-skill \
  --id your-handle/my-skill \
  --version 1.0.0 \
  --visibility private
```

A successful login stores the token at `agents/.agentick/auth.json`. The file is
created with user-only permissions where supported and is covered by AgenTick's
managed `.gitignore` block. The token is never written to YAML, lockfiles, JSONL
history, command output, or published bundles.
