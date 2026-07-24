//! Compiler-backed Skillib language server.

mod server;
mod transport;

use serde::{Deserialize, Serialize};
use skillib_compiler::{CompileResult, Compiler, SkillCompiler};
use skillib_source::SourceFile;
use std::path::PathBuf;

pub use server::serve;
pub use transport::StdioTransport;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub path: PathBuf,
    pub version: i32,
    pub text: String,
}

pub trait LanguageAnalysis: Send + Sync {
    fn analyze(&self, document: &Document) -> anyhow::Result<CompileResult>;
    fn top_level_completions(&self) -> &'static [&'static str];
}

#[derive(Debug, Default, Clone, Copy)]
pub struct SkillibAnalysis;

impl LanguageAnalysis for SkillibAnalysis {
    fn analyze(&self, document: &Document) -> anyhow::Result<CompileResult> {
        let source = SourceFile::new(document.path.clone(), document.text.clone())?;
        Ok(SkillCompiler.compile(&source))
    }

    fn top_level_completions(&self) -> &'static [&'static str] {
        &["define", "language", "version", "description", "use", "classify", "goal", "source", "event", "input", "process", "constraints", "expected", "output"]
    }
}
