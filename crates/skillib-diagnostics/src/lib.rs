//! Stable diagnostics shared by the parser, compiler, CLI, and LSP.

use serde::{Deserialize, Serialize};
use skillib_source::Span;

/// Diagnostic severity.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    /// Compilation cannot continue.
    Error,
    /// Compilation may continue but publishing policy may reject it.
    Warning,
    /// Informational guidance.
    Information,
}

/// A source-aware compiler diagnostic.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Diagnostic {
    /// Stable code such as `SKL1001`.
    pub code: String,
    /// Severity level.
    pub severity: Severity,
    /// Human-readable explanation.
    pub message: String,
    /// Primary source range.
    pub span: Span,
}

impl Diagnostic {
    /// Creates an error diagnostic.
    #[must_use]
    pub fn error(code: impl Into<String>, message: impl Into<String>, span: Span) -> Self {
        Self {
            code: code.into(),
            severity: Severity::Error,
            message: message.into(),
            span,
        }
    }
}

/// Returns true when diagnostics contain at least one error.
#[must_use]
pub fn has_errors(diagnostics: &[Diagnostic]) -> bool {
    diagnostics.iter().any(|item| item.severity == Severity::Error)
}
