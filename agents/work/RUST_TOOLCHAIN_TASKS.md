# Rust Toolchain Tasks

Issue: #11
Plan: `agents/work/RUST_TOOLCHAIN_PLAN.md`

## Workspace foundation

- [ ] Add root Cargo workspace and pinned Rust toolchain.
- [ ] Add shared workspace lints that forbid unsafe code.
- [ ] Add CI commands for format, clippy, tests, and builds.
- [ ] Add architecture checks for Rust source-file size and crate boundaries.

## Language core

- [ ] Implement source files, spans, line indexes, and supported extension detection.
- [ ] Implement stable diagnostics and machine-readable reports.
- [ ] Implement lexer with indentation, comments, strings, arrays, numbers, and punctuation.
- [ ] Implement typed AST for all Skillib 0.1 blocks.
- [ ] Implement parser with recovery for incomplete `.sl` and `.skillib` documents.
- [ ] Implement semantic symbols, duplicate checks, references, types, and output placeholders.
- [ ] Implement deterministic Skill IR and schema versioning.
- [ ] Implement compiler orchestration and content hashes.
- [ ] Implement canonical formatter.
- [ ] Add valid, invalid, and golden compiler fixtures.

## Runtime and packages

- [ ] Implement runtime input validation and event selection.
- [ ] Implement source declarations and permission planning without fetching during compilation.
- [ ] Implement dependency manifest and deterministic lockfile.
- [ ] Implement package archive creation and integrity verification.
- [ ] Implement local package cache.

## Registry integration

- [ ] Implement trait-based registry client.
- [ ] Implement HTTP transport for the Next.js API.
- [ ] Implement token storage without exposing secrets in logs.
- [ ] Implement identity, search, resolve, download, and publish operations.
- [ ] Add or upgrade Next.js API endpoints for Rust compiler/package contracts.
- [ ] Store source, IR, hashes, compiler version, dependencies, and permissions per release.

## Watcher

- [ ] Implement recursive filesystem watcher with configured ignores.
- [ ] Emit structured file, language, diagnostic, compile, verification, and protected-file events.
- [ ] Persist append-only JSONL history and resumable sessions.
- [ ] Render modern colored hierarchical watch output entirely in the terminal.
- [ ] Add debouncing, rename handling, and graceful shutdown.

## CLI

- [ ] Implement `skillib init`, `new`, `check`, `format`, `compile`, and `inspect`.
- [ ] Implement `skillib watch`, `verify`, `history`, and `status`.
- [ ] Implement `skillib login`, `logout`, and `whoami`.
- [ ] Implement `skillib search`, `install`, `update`, `publish`, and package removal.
- [ ] Support JSON output for automation and stable exit codes.
- [ ] Package the Rust binary for Windows, Linux, and macOS.

## LSP

- [ ] Implement document synchronization and diagnostics.
- [ ] Implement contextual completion and hover.
- [ ] Implement document symbols, formatting, and go-to-definition.
- [ ] Implement local-import and registry-package resolution.
- [ ] Expose `skillib lsp` over stdio.

## Cleanup and site

- [ ] Remove the TypeScript CLI/watcher as the production implementation.
- [ ] Remove obsolete npm global-installer scripts and package commands.
- [ ] Keep only TypeScript packages required by the Next.js site and future extension.
- [ ] Update site publishing/editor flows for `.sl` and `.skillib` only.
- [ ] Update documentation, examples, install instructions, and migrations.

## Validation and closeout

- [ ] `cargo fmt --check` passes.
- [ ] `cargo clippy --workspace --all-targets -- -D warnings` passes.
- [ ] `cargo test --workspace` passes.
- [ ] Release builds pass for the supported targets.
- [ ] `.sl` and `.skillib` produce byte-identical IR for identical source.
- [ ] Watcher, registry, CLI, LSP, and Next.js integration smoke tests pass.
- [ ] Handoff is complete.
- [ ] Issue #11 is closed.
