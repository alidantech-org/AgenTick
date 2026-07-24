use skillib_compiler::{compile_text, Compiler, SkillCompiler};
use skillib_source::SourceFile;

const VALID_SKILL: &str = r#"define @test/example
language "0.1"
version "1.0.0"

description:
    Example skill used by compiler tests.

goal:
    - Produce a deterministic result.

input:
    target:
        type: string
        required: true

process:
    1. Inspect the target.
    2. Return a concise result.

constraints:
    - Do not invent evidence.

expected:
    - Summary

output:
    format: markdown
"#;

#[test]
fn extensions_produce_identical_ir() {
    let short = compile_text("example.sl", VALID_SKILL).expect(".sl should load");
    let long = compile_text("example.skillib", VALID_SKILL).expect(".skillib should load");
    assert!(short.success, "short extension diagnostics: {:?}", short.diagnostics);
    assert!(long.success, "long extension diagnostics: {:?}", long.diagnostics);
    assert_eq!(short.ir, long.ir);
    assert_eq!(short.ir_hash, long.ir_hash);
}

#[test]
fn missing_identity_is_reported() {
    let source = SourceFile::new("invalid.sl", "goal:\n    - Missing identity.\n").unwrap();
    let result = SkillCompiler.compile(&source);
    assert!(!result.success);
    assert!(result.diagnostics.iter().any(|item| item.code == "SKL1001"));
}
