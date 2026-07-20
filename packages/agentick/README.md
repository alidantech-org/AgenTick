# @alidantech/agentick

A project-local watcher, verifier, audit trail, and Agent Skill package manager.

## Run without installing globally

Use `pnpm dlx` when you want an isolated one-off invocation without changing your global tools:

```bash
pnpm dlx @alidantech/agentick init
pnpm dlx @alidantech/agentick verify
```

## Install the `agentick` command globally

After the package is published, install it through pnpm:

```bash
pnpm add --global @alidantech/agentick
agentick --help
```

`pnpm add --global` installs the package once and exposes the `agentick` executable declared by the package's `bin` field on your shell `PATH`.

On a new machine, pnpm may first ask you to configure its global binary directory:

```bash
pnpm setup
```

Restart the terminal after `pnpm setup`, then run the global installation command again. On Windows, this adds `PNPM_HOME` to the user environment and places the global pnpm command directory on `PATH`.

The npm equivalent is:

```bash
npm install --global @alidantech/agentick
agentick --help
```

## Link the command globally while developing AgenTick

From the AgenTick repository, build the CLI and link the local package globally:

```bash
pnpm --filter @alidantech/agentick build
cd packages/agentick
pnpm link --global
agentick --help
```

This makes the global `agentick` command point to the package in your working tree. Rebuild after changing TypeScript source so `dist/` contains the latest CLI code.

Remove the development link with:

```bash
cd packages/agentick
pnpm unlink --global
```

## Typical project workflow

```bash
agentick init
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
