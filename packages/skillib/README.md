# skillib

A project-local watcher, verifier, audit trail, and Agent Skill package manager.

## Run without installing globally

Use `pnpm dlx` when you want an isolated one-off invocation without changing your global tools:

```bash
pnpm dlx skillib init
pnpm dlx skillib verify
```

## Install the `skillib` command globally

After the package is published, install it through pnpm:

```bash
pnpm add --global skillib
skillib --help
```

`pnpm add --global` installs the package once and exposes the `skillib` executable declared by the package's `bin` field on your shell `PATH`.

On a new machine, pnpm may first ask you to configure its global binary directory:

```bash
pnpm setup
```

Restart the terminal after `pnpm setup`, then run the global installation command again. On Windows, this adds `PNPM_HOME` to the user environment and places the global pnpm command directory on `PATH`.

The npm equivalent is:

```bash
npm install --global skillib
skillib --help
```

## Link the command globally while developing Skillib

From the Skillib repository, build the CLI and link the local package globally:

```bash
pnpm --filter skillib build
cd packages/skillib
pnpm link --global
skillib --help
```

This makes the global `skillib` command point to the package in your working tree. Rebuild after changing TypeScript source so `dist/` contains the latest CLI code.

Remove the development link with:

```bash
cd packages/skillib
pnpm unlink --global
```

## Typical project workflow

```bash
skillib init
skillib watch --port 4317
skillib verify

# The registry URL remains explicit and project-controlled.
export SKILLIB_REGISTRY_URL=https://skillib.example.com

# Public packages can be pulled anonymously.
skillib skill add johnte/backend-review@2.3.1

# Create a token in the website account, then paste it into the hidden prompt.
skillib login
skillib whoami
skillib push agents/skills/my-skill \
  --id your-handle/my-skill \
  --version 1.0.0 \
  --visibility private
```

A successful login stores the token at `agents/.skillib/auth.json`. The file is
created with user-only permissions where supported and is covered by Skillib's
managed `.gitignore` block. The token is never written to YAML, lockfiles, JSONL
history, command output, or published bundles.
