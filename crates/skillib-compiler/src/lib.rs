//! Compiler orchestration from source text to deterministic Skill IR.

use serde::{Deserialize, Serialize};
use skillib_diagnostics::{Diagnostic, has_errors};
use skillib_ir::SkillIr;
use skillib_parser::parse;
use skillib_semantic::analyze;
use skillib_source::SourceFile;
use std::path::PathBuf;

/// Successful or failed compilation result.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompileResult {
    /// True when no error diagnostics were produced.
    pub success: bool,
    /// All syntax and semantic diagnostics.
    pub diagnostics: Vec<Diagnostic>,
    /// Canonical IR when compilation succeeds.
    pub ir: Option<SkillIr>,
    /// BLAKE3 hash of the original source.
    pub source_hash: String,
    /// BLAKE3 hash of deterministic IR JSON.
    pub ir_hash: Option<String>,
}

/// Compiler interface used by the CLI, watcher, LSP, and registry service.
pub trait Compiler {
    /// Compiles a source document.
    fn compile(&self, source: &SourceFile) -> CompileResult;
}

/// Default in-process compiler implementation.
#[derive(Debug, Default, Clone, Copy)]
pub struct SkillCompiler;

impl Compiler for SkillCompiler {
    fn compile(&self, source: &SourceFile) -> CompileResult {
        let parsed = parse(source);
        let mut diagnostics = parsed.diagnostics;
        let semantic = analyze(&parsed.file);
        diagnostics.extend(semantic.diagnostics);
        let ir = (!has_errors(&diagnostics)).then(|| semantic.model.map(SkillIr::from)).flatten();
        let source_hash = hash_bytes(source.text().as_bytes());
        let ir_hash = ir.as_ref().and_then(|value| {
            serde_json::to_vec(value).ok().map(|bytes| hash_bytes(&bytes))
        });
        CompileResult {
            success: ir.is_some() && !has_errors(&diagnostics),
            diagnostics,
            ir,
            source_hash,
            ir_hash,
        }
    }
}

/// Compiles source text using an explicit path.
pub fn compile_text(path: impl Into<PathBuf>, text: impl Into<String>) -> anyhow::Result<CompileResult> {
    let source = SourceFile::new(path, text)?;
    Ok(SkillCompiler.compile(&source))
}

fn hash_bytes(bytes: &[u8]) -> String {
    format!("blake3:{}", blake3::hash(bytes).to_hex())
}
