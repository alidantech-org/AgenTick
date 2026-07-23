//! Semantic validation and normalized language model.

use serde::{Deserialize, Serialize};
use skillib_ast::{BlockKind, SkillFile};
use skillib_diagnostics::Diagnostic;
use skillib_source::Span;
use std::collections::BTreeMap;

/// Normalized semantic representation used by the IR builder.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticSkill {
    /// Registry package identity.
    pub identity: String,
    /// Language version.
    pub language: String,
    /// Release version.
    pub version: Option<String>,
    /// Dependencies.
    pub dependencies: Vec<String>,
    /// Normalized block lines.
    pub blocks: BTreeMap<String, Vec<String>>,
}

/// Semantic analysis result.
#[derive(Debug)]
pub struct SemanticResult {
    /// Model is absent when required identity data is invalid.
    pub model: Option<SemanticSkill>,
    /// Semantic diagnostics.
    pub diagnostics: Vec<Diagnostic>,
}

/// Validates and lowers the AST.
#[must_use]
pub fn analyze(file: &SkillFile) -> SemanticResult {
    let mut diagnostics = Vec::new();
    let Some(identity) = file.identity.as_ref() else {
        return SemanticResult { model: None, diagnostics };
    };
    if !is_package_id(&identity.value) {
        diagnostics.push(Diagnostic::error(
            "SKL2001",
            "Package identity must use @namespace/name",
            identity.span,
        ));
    }
    let language = file.language.as_ref().map_or("0.1", |item| item.value.as_str());
    if language != "0.1" {
        diagnostics.push(Diagnostic::error(
            "SKL3001",
            "Unsupported language version; expected 0.1",
            file.language.as_ref().map_or(Span::new(0, 0), |item| item.span),
        ));
    }
    let blocks = file
        .blocks
        .iter()
        .map(|(kind, block)| (block_name(*kind).to_owned(), block.lines.iter().map(|line| line.value.clone()).collect()))
        .collect();
    let model = (!diagnostics.iter().any(|item| item.code.starts_with("SKL2") || item.code.starts_with("SKL3"))).then(|| SemanticSkill {
        identity: identity.value.clone(),
        language: language.to_owned(),
        version: file.version.as_ref().map(|item| item.value.clone()),
        dependencies: file.uses.iter().map(|item| item.value.clone()).collect(),
        blocks,
    });
    SemanticResult { model, diagnostics }
}

fn is_package_id(value: &str) -> bool {
    value.strip_prefix('@').is_some_and(|rest| {
        let mut parts = rest.split('/');
        parts.next().is_some_and(valid_name)
            && parts.next().is_some_and(valid_name)
            && parts.next().is_none()
    })
}

fn valid_name(value: &str) -> bool {
    !value.is_empty() && value.chars().all(|ch| ch.is_ascii_lowercase() || ch.is_ascii_digit() || ch == '-')
}

const fn block_name(kind: BlockKind) -> &'static str {
    match kind {
        BlockKind::Classify => "classify",
        BlockKind::Goal => "goal",
        BlockKind::Source => "source",
        BlockKind::Event => "event",
        BlockKind::Input => "input",
        BlockKind::Process => "process",
        BlockKind::Constraints => "constraints",
        BlockKind::Expected => "expected",
        BlockKind::Output => "output",
    }
}
