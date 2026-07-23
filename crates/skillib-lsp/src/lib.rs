//! Compiler-backed language-server analysis primitives.

use serde::{Deserialize, Serialize};
use skillib_compiler::{CompileResult, Compiler, SkillCompiler};
use skillib_source::SourceFile;
use std::path::PathBuf;

/// Text document snapshot maintained by an editor client.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    /// Document path.
    pub path: PathBuf,
    /// Monotonic editor version.
    pub version: i32,
    /// Current source text.
    pub text: String,
}

/// Analysis boundary used by stdio and future browser transports.
pub trait LanguageAnalysis: Send + Sync {
    /// Analyzes one document snapshot.
    fn analyze(&self, document: &Document) -> anyhow::Result<CompileResult>;
    /// Returns top-level keyword completions.
    fn top_level_completions(&self) -> &'static [&'static str];
}

/// Default compiler-backed analysis service.
#[derive(Debug, Default, Clone, Copy)]
pub struct SkillibAnalysis;

impl LanguageAnalysis for SkillibAnalysis {
    fn analyze(&self, document: &Document) -> anyhow::Result<CompileResult> {
        let source = SourceFile::new(document.path.clone(), document.text.clone())?;
        Ok(SkillCompiler.compile(&source))
    }

    fn top_level_completions(&self) -> &'static [&'static str] {
        &[
            "define", "language", "version", "description", "use", "classify",
            "goal", "source", "event", "input", "process", "constraints",
            "expected", "output",
        ]
    }
}
