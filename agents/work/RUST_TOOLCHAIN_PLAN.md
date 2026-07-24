# Skillib Rust Toolchain Plan

Issue: #11

## Decision

The Next.js site remains TypeScript. The production language toolchain is rebuilt in Rust. The existing TypeScript CLI and watcher are temporary legacy code and will be removed after the Rust binary reaches feature parity.

The Skillib language is authoritative. Both `.sl` and `.skillib` are first-class extensions for the same grammar. Markdown is not a supported skill source format.

## Workspace

```text
crates/
  skillib-source/       source files, spans, identifiers
  skillib-diagnostics/  stable diagnostic codes and reports
  skillib-syntax/       tokens and lexer
  skillib-ast/          typed language model
  skillib-parser/       syntax to AST with recovery
  skillib-semantic/     symbols, references, types, validation
  skillib-ir/           stable serializable compiler boundary
  skillib-compiler/     pipeline orchestration and hashing
  skillib-formatter/    canonical source formatting
  skillib-registry/     Next.js API client and package cache
  skillib-watcher/      filesystem observation and event stream
  skillib-runtime/      inputs, event selection, source plans
  skillib-lsp/          LSP adapter over compiler analysis
  skillib-cli/          terminal application and command routing
```

## Engineering constraints

- Rust files should have one role and normally remain at or below 150 lines.
- `unsafe` is forbidden in workspace crates.
- Domain behavior is exposed through traits; transport and storage implementations remain replaceable.
- Compiler output is deterministic for identical source and options.
- The parser never performs network, filesystem, source mounting, or command execution.
- Registry access is explicit, authenticated where required, and isolated behind `RegistryClient`.
- Watch mode renders in the terminal and never starts a browser dashboard.
- `.sl` and `.skillib` must behave identically.

## Language 0.1

Supported top-level constructs:

```text
define
language
version
description
use
classify
goal
source
event
input
process
constraints
expected
output
```

The language is declarative. It does not support arbitrary code, loops, functions, shell execution, direct network access, or dynamic plugins.

## Compiler stages

```text
Source → Lexer → Parser → AST → Semantic model → IR → Runtime plan
```

Each stage returns diagnostics with source spans. Errors block compilation. Warnings remain attached to the result and block publishing only when policy requires it.

## Registry contract

Rust communicates with the Next.js API for:

- token identity and authentication;
- package search and metadata completion;
- dependency and release resolution;
- package download and integrity verification;
- server-side validation and publication;
- LSP registry index refresh.

The site never implements a second parser or compiler. Publication requests include source, compiler metadata, deterministic IR, hashes, dependencies, and permissions. The API may invoke the same Rust compiler service for independent verification.

## CLI experience

The CLI uses structured colored output with a stable hierarchy:

```text
◆ Skillib check
├─ ✓ Parsed 1 skill
├─ ✓ Semantic validation passed
└─ ✓ IR hash sha256:...
```

Watch mode prints a persistent event stream in the terminal and concise diagnostics below each changed skill.

## Completion

Implementation is complete only after every task in `agents/work/RUST_TOOLCHAIN_TASKS.md` is checked, committed, validated, and issue #11 is closed.
