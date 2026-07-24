# skillib

A project-local watcher, verifier, audit trail, and Agent Skill package manager.

## Run without installing globally

After the package is published, use `pnpm dlx` for isolated one-off commands:

```bash
pnpm dlx skillib init
pnpm dlx skillib verify
```

## Install the `skillib` command globally

After publication, install it through pnpm:

```bash
pnpm add --global skillib
skillib --help
```

`pnpm add --global` installs the package once and exposes the `skillib` executable declared by the package's `bin` field.

On a new machine, pnpm may first ask you to configure its global binary directory:

```bash
pnpm setup
```

Restart the terminal after `pnpm setup`, then run the global installation command again. Confirm that the directory printed by `pnpm bin --global` is on your shell `PATH`.

The npm equivalent is:

```bash
npm install --global skillib
skillib --help
```

## Install the current working tree globally

Do not use `pnpm link --global .` from `packages/skillib`. A linked package is resolved as a standalone workspace and cannot resolve the monorepo's private `workspace:^` development packages.

From the repository root, run:

```bash
pnpm skillib:install-global
skillib --help
```

This command:

1. builds the bundled Skillib CLI;
2. creates the same `.tgz` package that npm receives;
3. installs that tarball globally with pnpm;
4. leaves the generated tarball in the ignored `.skillib-pack/` directory.

Run `pnpm skillib:install-global` again after changing CLI source. This tests the real publishable artifact instead of relying on workspace links.

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

A successful login stores the token at `agents/.skillib/auth.json`. The file is created with user-only permissions where supported and is covered by Skillib's managed `.gitignore` block. The token is never written to YAML, lockfiles, JSONL history, command output, or published bundles.
